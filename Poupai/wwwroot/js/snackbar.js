window.showSnackbar = function (message, isSuccess, isWarning ) {
    const snackbar = document.getElementById("snackbar");

    let type = "success";
    if (isWarning) {
        type = "warning";
    } else if (!isSuccess) {
        type = "error";
    }

    snackbar.className = `snackbar ${type} show`;
    snackbar.textContent = message;

    setTimeout(() => {
        snackbar.classList.remove("show");
    }, 3000);
}
