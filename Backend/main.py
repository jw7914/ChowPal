from typing import Union
from firebase_admin import credentials, auth, firestore
import firebase_admin
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
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


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


def authenticate_user(user_id):
    try:
        user = auth.get_user(user_id)
        return True
    except auth.UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking user: {e}")

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
@app.post("/users/insert")
def insert_user(data: dict): # Expects a json object
    
    "Parameters will be passed from the frontend"
    user_id = data.get("uid")
    email = data.get("email")
    name = data.get("name")

    #Ensure user exists first before inserting any data
    if authenticate_user(user_id):
        try:
            # Prepare user data
            user_data = {
                "email": email,
                "name": name
            }

            
            db.collection("Users").document(user_id).set(user_data)

            return {"message": "User inserted successfully", "doc_id": user_id, "data": user_data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error inserting user: {e}")
    else:
        print("user doesn't exist")
        return {"message": "User doesn't exist"}


@app.put("/users/update")
def update_user(data: dict):
    """Update user details in Firestore."""
    user_id = data.get("uid")
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