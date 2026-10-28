const researchForm = document.getElementById("research-form");

researchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const dataForm = Object.fromEntries(new FormData(researchForm));
    
    const queryParams = new URLSearchParams({
        course: dataForm.course || "",
        location: dataForm.location || ""
    }).toString();

    window.location.href = `/research?${queryParams}`;
});