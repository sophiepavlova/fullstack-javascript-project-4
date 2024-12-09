import axios from 'axios';
export default function getUrlContents(url) {
  return axios.get(url).then((response) => response.data).catch((err) => {
    console.log(err);
    return Promise.reject(err);
  });
};
