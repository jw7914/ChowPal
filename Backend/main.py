from typing import Union, List
from firebase_admin import credentials, auth, firestore, storage
import os
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Request
import firebase_admin.auth
import requests, json
from fastapi.middleware.cors import CORSMiddleware
import time
load_dotenv()



firebase_config = {
    "type": os.getenv("FIREBASE_TYPE"),
    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
    "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
    "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
    "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
    "universe_domain": os.getenv("FIREBASE_UNIVERSE_DOMAIN")
}
creds = credentials.Certificate(firebase_config)
firebase_admin.initialize_app(creds, {'storageBucket': os.getenv("FIREBASE_BUCKET")})



# Initialize Firestore
db = firestore.client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,                  
    allow_methods=["*"],                     
    allow_headers=["*"],                     
)
@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

#================================================================================================
# User Management
#================================================================================================

def get_user(idToken):
    try:
        decoded_token = auth.verify_id_token(idToken)  
        return decoded_token["uid"] 
    except Exception:
        return None

@app.get("/users/uid")
def api_get_uid(idToken: str = Query(...)):
    """Get user UID from ID token."""
    if not idToken:
        raise HTTPException(status_code=400, detail="Missing ID token")
    
    uid = get_user(idToken)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    return {"uid": uid}

@app.get("/users/details")
def api_get_user_details(uid: str = Query(...)):
    """Get user details from Firestore."""
    if not uid:
        raise HTTPException(status_code=400, detail="Missing UID")
    
    # Get user details from Firestore
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    # Check if the document exists
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    # Return the user document data
    return user_doc.to_dict()

# that uid only exists in auth db, that can only be used for auth 
# if we want like other things associated with them we need to use firestore db
@app.get("/users")
def find_user(idToken: str = Query(...)):
    if not idToken:
        raise HTTPException(status_code=400, detail="Missing ID token")
    
    uid = get_user(idToken)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    # Check if the document exists
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    # Return the user document data
    return user_doc.to_dict()

@app.get("/users/login-check")
def login_check(idToken: str = Query(...)):  # Using Query to retrieve idToken from the query string
    if not idToken:
        raise HTTPException(status_code=400, detail="Missing ID token")

    uid = get_user(idToken)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user token")

    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        user_ref.set({"firstLogin": True})
        first_login = True
    else:
        user_data = user_doc.to_dict()
        first_login = user_data.get("firstLogin", False)

    return {"redirect": "/firstlogin" if first_login else "/home"}

@app.post("/users/insert")
async def insert_user(
    idToken: str = Form(...),
    name: str = Form(...),
    favoriteCuisine: str = Form(...),
    location: str = Form(...),
    email: str = Form(...),
    accountType: str = Form(...),
    photos: List[UploadFile] = File(...)
):

    uid = get_user(idToken)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid ID token")

    bucket = storage.bucket()
    photo_urls = []

    for index, photo in enumerate(photos):
        extension = photo.filename.split(".")[-1]
        filename = f"users/{uid}/photo-{index + 1}-{uuid4().hex}.{extension}"
        blob = bucket.blob(filename)
        blob.upload_from_file(photo.file, content_type=photo.content_type)
        blob.make_public()
        photo_urls.append(blob.public_url)

    # 3. Save user info in Firestore
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    if accountType == "user":
        user_ref.update({
            "firstLogin": False,
            "name": name,
            "email": email,
            "favoriteCuisine": favoriteCuisine,
            "location": location,
            "accountType": accountType,
            "photos": photo_urls,
        })
    elif accountType == "restaurant":
        user_ref.update({
            "email": email,
            "accountType": accountType
        })

    return True

@app.put("/users/update")
def update_user(data: dict):
    """Update user details in Firestore."""
    user_id = data.get("idToken")
    email = data.get("email")
    name = data.get("name")
    # Ensure user exists before updating
    user_ref = db.collection("Users").document(user_id)
    user_doc = user_ref.get()

    if user_doc.exists:
        try:
            # Prepare update data
            update_data = {}
            if email:
                update_data["email"] = email
            if name:
                update_data["name"] = name

            if update_data:
                user_ref.update(update_data)
                return {"message": "User updated successfully", "doc_id": user_id, "updated_data": update_data}
            else:
                return {"message": "No fields provided for update"}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating user: {e}")
    else:
        return {"message": "User does not exist"}

@app.delete("/users/delete")
def delete_user(user_id: str):
    """Delete a user from Firestore."""
    # Ensure user exists before deleting
    user_ref = db.collection("Users").document(user_id)
    user_doc = user_ref.get()

    if user_doc.exists:
        try:
            user_ref.delete()
            return {"message": "User deleted successfully", "doc_id": user_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting user: {e}")
    else:
        return {"message": "User does not exist"}

@app.get("/users/{uid}/restaurant")
def get_claimed_restaurant(uid: str):
    """
    Retrieve the restaurant document owned by this user.
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()
    restaurant_id = user_data.get("restaurant_id")

    if not restaurant_id:
        raise HTTPException(status_code=404, detail="User has not claimed a restaurant")

    restaurant_ref = db.collection("places").document(restaurant_id)
    restaurant_doc = restaurant_ref.get()

    if not restaurant_doc.exists:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    restaurant_data = restaurant_doc.to_dict()
    restaurant_data["restaurant_id"] = restaurant_id  # include ID for frontend
    return restaurant_data


@app.post("/places/{place_id}/upload-photos")
async def upload_restaurant_photos(
    place_id: str,
    photos: List[UploadFile] = File(...)
):
    if len(photos) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 photos required.")

    bucket = storage.bucket()
    photo_urls = []

    for i, photo in enumerate(photos):
        filename = f"places/{place_id}/photo-{i + 1}.jpg"
        blob = bucket.blob(filename)
        blob.upload_from_file(photo.file, content_type=photo.content_type)
        blob.make_public()
        photo_urls.append(blob.public_url)

    # Save to Firestore (optional)
    db.collection("places").document(place_id).update({
        "photo_urls": photo_urls
    })

    return {"message": "Photos uploaded successfully", "photo_urls": photo_urls}


#================================================================================================
# User Matching
#================================================================================================

@app.post("/users/match_pending")
def add_pending_match(user_id: str, match_id: str):
    """
    Add a pending match to the user's document in Firestore.
    """
    try:
        pending_ref = db.collection("users").document(user_id).collection("matches").document("pending")
        pending_doc = pending_ref.get()
        if not pending_doc.exists:
            pending_ref.set({"matches": []})
            pending_doc = pending_ref.get()
        pending_data = pending_doc.to_dict()
        pending_matches = pending_data.get("matches", [])
        if match_id in pending_matches:
            raise HTTPException(status_code=400, detail="Match already exists in pending matches")
        pending_matches.append(match_id)
        pending_ref.update({"matches": pending_matches})
        return {"message": "Pending match added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding pending match: {e}")

@app.delete("/users/match_pending")
def remove_pending_match(user_id: str, match_id: str):
    """
    Remove a pending match from the user's document in Firestore.
    """
    try:
        pending_ref = db.collection("users").document(user_id).collection("matches").document("pending")
        pending_doc = pending_ref.get()
        if not pending_doc.exists:
            raise HTTPException(status_code=404, detail="No pending matches found")
        pending_data = pending_doc.to_dict()
        pending_matches = pending_data.get("matches", [])
        if match_id not in pending_matches:
            raise HTTPException(status_code=400, detail="Match does not exist in pending matches")
        pending_matches.remove(match_id)
        pending_ref.update({"matches": pending_matches})
        return {"message": "Pending match removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing pending match: {e}")

@app.get("/users/match_pending")
def get_pending_matches(user_id: str):
    """
    Get all pending matches for the user.
    """
    try:
        pending_ref = db.collection("users").document(user_id).collection("matches").document("pending")
        pending_doc = pending_ref.get()
        if not pending_doc.exists:
            raise HTTPException(status_code=404, detail="No pending matches found")
        pending_data = pending_doc.to_dict()
        return {"matches": pending_data.get("matches", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving pending matches: {e}")

@app.post("/users/match_confirmed")
def add_confirmed_match(user_id: str, match_id: str):
    """
    Add a confirmed match to the user's document in Firestore.
    """
    try:
        confirmed_ref = db.collection("users").document(user_id).collection("matches").document("confirmed")
        confirmed_doc = confirmed_ref.get()
        if not confirmed_doc.exists:
            confirmed_ref.set({"matches": []})
            confirmed_doc = confirmed_ref.get()
        confirmed_data = confirmed_doc.to_dict()
        confirmed_matches = confirmed_data.get("matches", [])
        if match_id in confirmed_matches:
            raise HTTPException(status_code=400, detail="Match already exists in confirmed matches")
        confirmed_matches.append(match_id)
        confirmed_ref.update({"matches": confirmed_matches})
        return {"message": "Confirmed match added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding confirmed match: {e}")

@app.delete("/users/match_confirmed")
def remove_confirmed_match(user_id: str, match_id: str):
    """
    Remove a confirmed match from the user's document in Firestore.
    """
    try:
        confirmed_ref = db.collection("users").document(user_id).collection("matches").document("confirmed")
        confirmed_doc = confirmed_ref.get()
        if not confirmed_doc.exists:
            raise HTTPException(status_code=404, detail="No confirmed matches found")
        confirmed_data = confirmed_doc.to_dict()
        confirmed_matches = confirmed_data.get("matches", [])
        if match_id not in confirmed_matches:
            raise HTTPException(status_code=400, detail="Match does not exist in confirmed matches")
        confirmed_matches.remove(match_id)
        confirmed_ref.update({"matches": confirmed_matches})
        return {"message": "Confirmed match removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing confirmed match: {e}")

@app.get("/users/match_confirmed")
def get_confirmed_matches(user_id: str):
    """
    Get all confirmed matches for the user.
    """
    try:
        confirmed_ref = db.collection("users").document(user_id).collection("matches").document("confirmed")
        confirmed_doc = confirmed_ref.get()
        if not confirmed_doc.exists:
            raise HTTPException(status_code=404, detail="No confirmed matches found")
        confirmed_data = confirmed_doc.to_dict()
        return {"matches": confirmed_data.get("matches", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving confirmed matches: {e}")

@app.post("/users/match")
def handle_match(user_id: str=Form(...), match_id: str = Form(...)):
    """
    Handles user matching. If match_id has user_id in pending, confirm match.
    Otherwise, add match_id to user_id's pending.
    """
    try:
        # Check if match_id has user_id in pending
        match_pending_ref = db.collection("users").document(match_id).collection("matches").document("pending")
        match_pending_doc = match_pending_ref.get()
        match_pending_list = match_pending_doc.to_dict().get("matches", []) if match_pending_doc.exists else []

        if user_id in match_pending_list:
            # Confirm for both
            for uid1, uid2 in [(user_id, match_id), (match_id, user_id)]:
                conf_ref = db.collection("users").document(uid1).collection("matches").document("confirmed")
                conf_doc = conf_ref.get()
                if not conf_doc.exists:
                    conf_ref.set({"matches": []})
                conf_data = conf_doc.to_dict()
                if uid2 not in conf_data.get("matches", []):
                    conf_data["matches"].append(uid2)
                    conf_ref.update({"matches": conf_data["matches"]})

            # Remove user_id from match_id's pending
            match_pending_list.remove(user_id)
            match_pending_ref.update({"matches": match_pending_list})

            return {"status": "confirmed", "message": "Match confirmed!"}
        else:
            # Add match_id to user_id's pending
            user_pending_ref = db.collection("users").document(user_id).collection("matches").document("pending")
            user_pending_doc = user_pending_ref.get()
            if not user_pending_doc.exists:
                user_pending_ref.set({"matches": [match_id]})
            else:
                user_data = user_pending_doc.to_dict()
                if match_id not in user_data["matches"]:
                    user_data["matches"].append(match_id)
                    user_pending_ref.update({"matches": user_data["matches"]})

            return {"status": "pending", "message": "Match request sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




#================================================================================================
# Places API Handling
#================================================================================================
# Load the Google Places API key from environment variables
PLACES_API_KEY = os.getenv("PLACES_API_KEY")

def search_places_text(query, specifications):
    """
    Search for places using the Google Places Text Search API.

    Args:
        query (str): The search query string (e.g., "restaurants in New York").
        specifications (list of tuples): Additional specifications for the search in the form of 
                                          [('specification1', 'value1'), ('specification2', 'value2')].
                                          Supported specifications include maxprice, minprice, opennow, type, etc.

    Returns:
        list: A list of results from the API response.
    """
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json?"
    
    # Append additional specifications to the query string
    if specifications:
        for spec in specifications:
            if spec[2] == 'None':  # If the specification has no value, add only the key
                query += "&" + spec[0]
            else:  # Otherwise, add the key-value pair
                query += "&" + spec[0] + "=" + spec[1]

    # Make the API request
    r = requests.get(url + 'query=' + query + '&type=restaurant' + '&key=' + PLACES_API_KEY)
    x = r.json()

    # Return the results from the API response
    return x['results']

def search_places_nearby(location, radius, max_pages=3):
    """
    Search for nearby places using the Google Places Nearby Search API, including multiple pages. Each page contains up to 20 results.

    Args:
        location (str): The latitude and longitude of the location.
        radius (str): The search radius in meters.
        max_pages (int): Max number of pages to fetch (1-3).

    Returns:
        list: A list of all results across pages.
    """
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": location,
        "radius": radius,
        "type": "restaurant",
        "key": PLACES_API_KEY
    }

    all_results = []
    pages_fetched = 0

    while pages_fetched < max_pages:
        response = requests.get(url, params=params)
        data = response.json()

        # Add current page of results
        results = data.get("results", [])
        all_results.extend(results)
        pages_fetched += 1

        # Handle pagination
        next_page_token = data.get("next_page_token")
        if not next_page_token:
            break

        # Prepare for next request
        params = {
            "pagetoken": next_page_token,
            "key": PLACES_API_KEY
        }

        # Wait for token to become valid (required by Google)
        time.sleep(2)

    return all_results

def get_place_details(place_id, fields=None):
    """
    Get details of a place using the Google Places Details API.

    Args:
        place_id (str): The unique identifier for the place.

    Returns:
        dict: A dictionary containing the details of the place.
    """
    url = "https://places.googleapis.com/v1/places/"
    if not fields:
        fields= "name,photos"

    # Make the API request
    r = requests.get(url + place_id + "?fields=" + fields + '&key=' + PLACES_API_KEY)
    x = r.json()

    # Return the results from the API response
    return x

def get_place_photos(photo_reference):
    """
    Get photos of a place using the Google Places Photo API.

    Args:
        photo_reference (str): The unique identifier for the photo.

    Returns:
        str: The URL of the photo.
    """
    url = "https://maps.googleapis.com/maps/api/place/photo?"
    params = {
        "photoreference": photo_reference,
        "key": PLACES_API_KEY,
        "maxwidth": 400
    }
    
    # Make the API request
    r = requests.get(url, params=params)
    
    # Return the photo URL
    return r.url

#print(search_places_nearby("40.65010000,-73.949580000","200"))

def get_place(place_id):
    """
    Get place details from Firestore.

    Args:
        place_id (str): The unique identifier for the place.

    Returns:
        dict: A dictionary containing the details of the place.
    """
    # Reference to the Firestore places collection
    places_ref = db.collection("places").document(place_id)
    
    # Get the document
    doc = places_ref.get()

    # Check if the document exists
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Place not found")

    # Return the document data
    return doc.to_dict()

def make_review(place_id, user_id, review_text, rating):
    """
    Create a review for a place.

    Args:
        place_id (str): The unique identifier for the place.
        user_id (str): The unique identifier for the user.
        review_text (str): The text of the review.
        rating (int): The rating given by the user.

    Returns:
        dict: A dictionary containing the details of the created review.
    """
    # Reference to the Firestore reviews collection
    reviews_ref = db.collection("places").document(place_id).collection("reviews")

    # Create a new review document
    review_data = {
        "user_id": user_id,
        "review_text": review_text,
        "rating": rating,
        "timestamp": firestore.SERVER_TIMESTAMP
    }
    
    try:
        reviews_ref.document(f"review_{user_id}").set(review_data)
        return {"message": "Review created successfully", "review_data": review_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating review: {e}")

def get_reviews(place_id):
    """
    Get reviews for a place.

    Args:
        place_id (str): The unique identifier for the place.

    Returns:
        list: A list of reviews for the place.
    """
    # Reference to the Firestore reviews collection
    reviews_ref = db.collection("places").document(place_id).collection("reviews")
    
    try:
        reviews = reviews_ref.stream()
        review_list = [review.to_dict() for review in reviews]
        return {"message": "Reviews retrieved successfully", "reviews": review_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving reviews: {e}")

def add_user_to_queue(place_id, user_id):
    """
    Adds a user to the queue of the specified restaurant.

    Args:
        place_id (str): The place_id of the restaurant.
        user_id (str): The UID of the user to add to the queue.

    Returns:
        dict: Result message and current queue.
    """
    try:
        place_ref = db.collection("places").document(place_id)
        doc = place_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        place_data = doc.to_dict()
        queue = place_data.get("queue", [])

        if user_id in queue:
            raise HTTPException(status_code=400, detail="User is already in the queue")


        queue.append(user_id)
        place_ref.update({"queue": queue})

        return {"message": "User added to queue", "queue": queue}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding user to queue: {e}")

def remove_user_from_queue(place_id, user_id):
    """
    Removes a user from the queue of the specified restaurant.

    Args:
        place_id (str): The place_id of the restaurant.
        user_id (str): The UID of the user to remove from the queue.

    Returns:
        dict: Result message and current queue.
    """
    try:
        place_ref = db.collection("places").document(place_id)
        doc = place_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        place_data = doc.to_dict()
        queue = place_data.get("queue", [])

        if user_id not in queue:
            return {"message": "User is not in the queue", "queue": queue}

        queue.remove(user_id)
        place_ref.update({"queue": queue})

        return {"message": "User removed from queue", "queue": queue}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing user from queue: {e}")

def get_queue(place_id):
    """
    Retrieves the queue of the specified restaurant.

    Args:
        place_id (str): The place_id of the restaurant.

    Returns:
        dict: Result message and current queue.
    """
    try:
        place_ref = db.collection("places").document(place_id)
        doc = place_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        place_data = doc.to_dict()
        queue = place_data.get("queue", [])

        return {"queue": queue}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving queue: {e}")

def add_owner_account(place_id, user_id):
    place_ref = db.collection("places").document(place_id)
    user_ref = db.collection("users").document(user_id)

    place_doc = place_ref.get()
    if not place_doc.exists:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    current_owner = place_doc.get("owner_account")
    if current_owner:
        raise HTTPException(status_code=400, detail="Restaurant already claimed")

    place_ref.update({
        "owner_account": user_id
    })

    user_ref.update({
        "claimed": True,
        "restaurant_id": place_id
    })

    return {
        "message": "Restaurant successfully claimed",
        "user_claimed": True,
        "restaurant_id": place_id
    }



def change_owner_account(place_id, new_user_id):
    """
    Changes the owner account of a restaurant in Firestore.

    Args:
        place_id (str): The place_id of the restaurant.
        new_user_id (str): The UID of the new user to set as the owner.

    Returns:
        dict: Result message and updated restaurant data.
    """
    try:
        place_ref = db.collection("places").document(place_id)
        doc = place_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        place_ref.update({"owner_account": new_user_id})
        return {"message": "Owner account changed successfully", "place_data": place_ref.get().to_dict()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing owner account: {e}")


def load_nearby(location: str, radius: str):
    """
    Load nearby places based on location and radius into database.
    """
    try:
        results = search_places_nearby(location, radius)
        for place in results:
            rest_id = place.get("place_id")
            if not rest_id:
                continue

            # Check if the place already exists in Firestore
            place_ref = db.collection("places").document(rest_id)
            if not place_ref.get().exists or "owner_account" not in place_ref.get().to_dict():
                # If the place doesn't exist, add it to Firestore
                place_ref.set({
                    "name": place.get("name"),
                    "address": place.get("vicinity"),
                    "location": place.get("geometry", {}).get("location"),
                    "queue": [],
                    "owner_account": "",
                })
        return {"message": "Nearby restaurants loaded successfully", "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading nearby places: {e}")
    return {"message": "No nearby places found"}

#print(load_nearby("40.69276682486575, -73.98560503927554","500"))

@app.get("/places/search-text")
def api_search_text_places(query: str, specifications: Union[str, None] = None):
    """
    Search for places using text query and optional specifications.
    `specifications` should be passed as a stringified JSON list of tuples.
    Example: '[["maxprice", "2", "value"], ["opennow", "", "None"]]'
    """
    try:
        specs = json.loads(specifications) if specifications else []
        results = search_places_text(query, specs)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

@app.get("/places/{place_id}")
def api_get_place(place_id: str):
    """
    Retrieve a place from Firestore.
    """
    return get_place(place_id)

@app.post("/places/{place_id}/reviews/add")
def api_add_review(
    place_id: str,
    user_id: str = Form(...),
    review_text: str = Form(...),
    rating: int = Form(...)
):
    return make_review(place_id, user_id, review_text, rating)

@app.get("/places/{place_id}/reviews")
def api_get_reviews(place_id: str):
    return get_reviews(place_id)

@app.post("/places/{place_id}/queue/add")
def api_add_user_to_queue(place_id: str, user_id: str = Form(...)):
    return add_user_to_queue(place_id, user_id)

@app.post("/places/{place_id}/queue/remove")
def api_remove_user_from_queue(place_id: str, user_id: str = Form(...)):
    return remove_user_from_queue(place_id, user_id)

@app.get("/places/{place_id}/queue")
def api_get_queue(place_id: str):
    return get_queue(place_id)

@app.get("/restaurants/locations")
def get_restaurant_locations():
    try:
        places_ref = db.collection("places")
        docs = places_ref.stream()

        locations = []
        for doc in docs:
            data = doc.to_dict()
            loc = data.get("location")
            name = data.get("name")
            if loc and name:
                locations.append({
                    "key": doc.id,
                    "name": name,
                    "address": data.get("address"),
                    "location": {"lat": loc.get("lat"), "lng": loc.get("lng")}
                })

        return {"locations": locations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch locations: {e}")

@app.get("/places/{place_id}/photos")
def api_get_place_photos(place_id: str):
    """
    Retrieve photos for a place.
    """
    try:
        place_details = get_place_details(place_id)
        photos = place_details.get("photos", [])
        photo_urls = [get_place_photos(photo.get("name")) for photo in photos if photo.get("name")]
        return {"photos": photo_urls}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch photos: {e}")

@app.get("/places/{place_id}/photo/{photo_num}")
def api_get_place_photo(place_id: str, photo_num: int):
    """
    Retrieve a specific photo for a place.
    """
    try:
        place_details = get_place_details(place_id)
        photos = place_details.get("photos", [])
        if photo_num < 0 or photo_num >= len(photos):
            raise HTTPException(status_code=400, detail="Invalid photo number")
        photo_reference = photos[photo_num]["photo_reference"]
        return {"photo_url": get_place_photos(photo_reference)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch photo: {e}")

@app.post("/places/{place_id}/add-owner")
def api_add_owner_account(place_id: str, user_id: str = Form(...)):
    """
    Add an owner account to a restaurant.
    """
    return add_owner_account(place_id, user_id)

@app.get("/places/{place_id}/change-owner")
def api_change_owner_account(place_id: str, new_user_id: str = Form(...)):
    """
    Change the owner account of a restaurant.
    """
    return change_owner_account(place_id, new_user_id)