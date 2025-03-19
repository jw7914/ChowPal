from typing import Union
from firebase_admin import credentials, auth, firestore
import firebase_admin
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
import firebase_admin.auth
import requests, json
from fastapi.middleware.cors import CORSMiddleware
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
firebase_admin.initialize_app(creds)



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

# @app.get("/firebase")
# def authenticate_user(email: str = Query(..., description="User email to authenticate")):
#     """
#     Authenticate a user by email using Firebase Authentication.
#     """
#     try:
#         user = auth.get_user_by_email(email)
#         return {"message": "User found", "uid": user.uid, "email": user.email}
#     except auth.UserNotFoundError:
#         raise HTTPException(status_code=404, detail="User not found")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error finding user: {e}")



# that uid only exists in auth db, that can only be used for auth 
# if we want like other things associated with them we need to use firestore db
@app.get("/users")
def login_check(idToken: str = Query(...)):
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

    return {"redirect": "/firstlogin" if first_login else "/"}

@app.post("/users/insert")
async def insert_user(request: Request):
    # Get the data from the request body as a dictionary
    data = await request.json()

    # Extract idToken from the data
    id_token = data.get("idToken")
    if not id_token:
        raise HTTPException(status_code=400, detail="Missing ID token")

    # Validate the user token and get the user ID
    uid = get_user(id_token)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user token")

    # Reference to the Firestore user document
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    accountType = data.get("accountType")
    if (accountType == "user"):
        user_ref.update({
            "firstLogin": False,
            "name": data.get("name"),  
            "email": data.get("email"), 
            "favoriteCuisine": data.get("favoriteCuisine"),
            "location": data.get("location"),
            "accountType": accountType,
            "user_content": []
        })
    elif (accountType == "restaurant"):
        user_ref.update({
            "email": data.get("email"), 
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
PLACES_API_KEY = os.getenv("PLACES_API_KEY")

def search_places_text(query, specifications):
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json?"
    #in the form of an array of tuples: [('specification1', 'value1'), ('specification2', 'value2')]
    #only works for maxprice, minprice, opennow, type alr default(restaurant), and pagetoken
    if(specifications):
        for spec in specifications:
            if spec[2] == 'None':
                query += "&" + spec[0]
            else:
                query += "&" + spec[0] + "=" + spec[1]
    r=requests.get(url + 'query=' + query + '&type=restaurant' + '&key=' + PLACES_API_KEY)
    x=r.json()
    return x['results']

def search_places_nearby(location, radius):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
    r=requests.get(url + 'location=' + location + '&radius=' + radius + '&type=restaurant' + '&key=' + PLACES_API_KEY)
    x=r.json()
    return x['results']

print(search_places_nearby("40.65010000,-73.949580000","200"))