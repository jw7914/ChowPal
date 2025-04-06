import axios from "axios";

const app = axios.create({ baseURL: "http://localhost:8000" }); //Backend url (can customize based on port)

export async function handleFirstLogin(idToken) {
  try {
    const response = await app.get(`/users/login-check?idToken=${idToken}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function handleInsertUser(formData) {
  try {
    const response = await app.post(`/users/insert`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function getUserDetails(idToken) {
  try {
    const response = await app.get(`/users?idToken=${idToken}`);
    return response.data;
  } catch (err) {
    return err;
  }
}
