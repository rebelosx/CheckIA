/*==========================================
 Check IA
 Menu de perfil (dropdown)
==========================================*/

const profileWrapper = document.querySelector(".profile-wrapper");
const profileButton = document.getElementById("profileButton");

if (profileButton && profileWrapper) {

    profileButton.addEventListener("click", (e) => {
        e.stopPropagation();
        profileWrapper.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!profileWrapper.contains(e.target)) {
            profileWrapper.classList.remove("open");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            profileWrapper.classList.remove("open");
        }
    });
}