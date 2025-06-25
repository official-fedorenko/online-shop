// filepath: online-shop/online-shop/js/auth.js

function initGoogleAuth() {
  gapi.load("client:auth2", function () {
    gapi.auth2
      .init({
        client_id: "YOUR_CLIENT_ID.apps.googleusercontent.com",
        scope: "profile email",
      })
      .then(function (auth) {
        const signinButton = document.getElementById("google-signin-button");
        const signoutButton = document.getElementById("google-signout-button");

        if (signinButton) {
          attachSignin(signinButton, auth);
        }
        if (signoutButton) {
          attachSignout(signoutButton, auth);
        }

        // Проверяем, авторизован ли пользователь
        updateUI(auth.isSignedIn.get());

        // Слушаем изменения состояния авторизации
        auth.isSignedIn.listen(updateUI);
      });
  });
}

function attachSignin(element, auth) {
  element.onclick = function () {
    auth.signIn().then(function (googleUser) {
      const profile = googleUser.getBasicProfile();
      console.log("Пользователь вошел:", profile.getName());
      updateUI(true);
    });
  };
}

function attachSignout(element, auth) {
  element.onclick = function () {
    auth.signOut().then(function () {
      console.log("Пользователь вышел");
      updateUI(false);
    });
  };
}

function updateUI(isSignedIn) {
  const signinButton = document.getElementById("google-signin-button");
  const signoutButton = document.getElementById("google-signout-button");

  if (signinButton && signoutButton) {
    if (isSignedIn) {
      signinButton.style.display = "none";
      signoutButton.style.display = "inline-block";
    } else {
      signinButton.style.display = "inline-block";
      signoutButton.style.display = "none";
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  initGoogleAuth();
});
