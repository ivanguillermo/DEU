<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAz14i2wcoJ7hQpbQ0_unr41_0ms4PIoTI",
    authDomain: "prodeu-61ee3.firebaseapp.com",
    projectId: "prodeu-61ee3",
    storageBucket: "prodeu-61ee3.firebasestorage.app",
    messagingSenderId: "635497125360",
    appId: "1:635497125360:web:0fb70f7f72e51097deb935",
    measurementId: "G-WCZ15JZ8FV"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
