// filepath: online-shop/online-shop/js/auth.js

function initGoogleAuth() {
    gapi.load('client:auth2', function() {
        gapi.auth2.init({
            client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
            scope: 'profile email'
        }).then(function(auth) {
            attachSignin(document.getElementById('google-signin-button'), auth);
        });
    });
}

function attachSignin(element, auth) {
    element.onclick = function() {
        auth.signIn().then(function(googleUser) {
            const profile = googleUser.getBasicProfile();
            console.log('ID: ' + profile.getId());
            console.log('Name: ' + profile.getName());
            console.log('Image URL: ' + profile.getImageUrl());
            console.log('Email: ' + profile.getEmail());
            // Handle successful login (e.g., store user info, redirect)
        });
    };
}

function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function() {
        console.log('User signed out.');
        // Handle sign out (e.g., redirect to login page)
    });
}

// Call initGoogleAuth on page load
window.onload = function() {
    initGoogleAuth();
};