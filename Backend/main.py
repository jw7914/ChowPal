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
app = FastAPI()



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


# Create FastAPI app
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

def get_place_details(place_id):
    """
    Get details of a place using the Google Places Details API.

    Args:
        place_id (str): The unique identifier for the place.

    Returns:
        dict: A dictionary containing the details of the place.
    """
    url = "https://places.googleapis.com/v1/places/"
    fields= "name,formatted_address,geometry/location,rating,opening_hours/periods/open/close,photos,website,reviews"

    # Make the API request
    r = requests.get(url + place_id + '&key=' + "?fields"+fields+PLACES_API_KEY)
    x = r.json()

    # Return the results from the API response
    return x['result']

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
            return {"message": "User is already in the queue", "queue": queue}

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

        return {"message": "Queue retrieved successfully", "queue": queue}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving queue: {e}")


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
            if not place_ref.get().exists or "location" not in place_ref.get().to_dict():
                # If the place doesn't exist, add it to Firestore
                place_ref.set({
                    "name": place.get("name"),
                    "address": place.get("vicinity"),
                    "location": place.get("geometry", {}).get("location"),
                    "queue": [],
                })
        return {"message": "Nearby restaurants loaded successfully", "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading nearby places: {e}")
    return {"message": "No nearby places found"}

#print(load_nearby("40.65010000,-73.949580000","500"))

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
                    "location": {"lat": loc.get("lat"), "lng": loc.get("lng")}
                })

        return {"locations": locations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch locations: {e}")