function initAuthForm({ formId, endpoint, buildPayload, onSuccess, validate }) {
  const form = document.getElementById(formId);
  const messageBox = document.getElementById("authMessage");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageBox.textContent = "";
    messageBox.classList.remove("is-error", "is-success");

    const formData = Object.fromEntries(new FormData(form).entries());

    if (typeof validate === "function") {
      const validationError = validate(formData, form);
      if (validationError) {
        messageBox.textContent = validationError;
        messageBox.classList.add("is-error");
        return;
      }
    }

    const submitButton = form.querySelector(".auth-button");
    if (!submitButton) return;
    
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Please wait…";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(buildPayload(formData)),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Something went wrong.");
      }

      messageBox.textContent = result.message || "Success.";
      messageBox.classList.add("is-success");
      onSuccess(result);
    } catch (error) {
      messageBox.textContent = error.message;
      messageBox.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}
