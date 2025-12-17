function orderNow() {
    window.location.href = "menu.html"; // redirect to menu page
}
function addToCartAnimation(imgElement) {
    const cart = document.querySelector("#cartIcon");
    const imgClone = imgElement.cloneNode(true);

    const imgRect = imgElement.getBoundingClientRect();
    const cartRect = cart.getBoundingClientRect();

    imgClone.style.position = "fixed";
    imgClone.style.top = imgRect.top + "px";
    imgClone.style.left = imgRect.left + "px";
    imgClone.style.width = imgElement.offsetWidth + "px";
    imgClone.style.transition = "all 0.8s ease";
    imgClone.style.zIndex = "2000";

    document.body.appendChild(imgClone);

    setTimeout(() => {
        imgClone.style.top = cartRect.top + "px";
        imgClone.style.left = cartRect.left + "px";
        imgClone.style.width = "20px";
        imgClone.style.opacity = "0.2";
    }, 20);

    setTimeout(() => {
        imgClone.remove();
    }, 900);
}
