const backend_url = "http://127.0.0.1:8000/";

const register_endpoint = `${backend_url}auth/register`;
const login_endpoint = `${backend_url}auth/login`;
const adminPanel_endpoint=`${backend_url}admin`;
const userPanel_endpoint=`${backend_url}user`;
const myProfile_endpoint=`${backend_url}user/me`;
export { backend_url, register_endpoint, login_endpoint,adminPanel_endpoint ,userPanel_endpoint,myProfile_endpoint};
