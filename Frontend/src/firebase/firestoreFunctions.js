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

export async function handleInsertUser(data) {
  try {
    const response = await app.post(`/users/insert`, data);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function getUserDetails(idToken) {
  try {
    const response = await app.get(`/usersidToken=${idToken}`);
    return response.data;
  } catch (err) {
    return err;
  }
}
