// Define the categories for both cookies and scripts
const consentCategories = {
  essential: {
    description: "Essential for site functionality",
    scripts: ["localhost"],
    cookies: ["localhost"],
  },
  analytics: {
    description: "Analytics tracking",
    scripts: ["connect.facebook.net", "googletagmanager.com"],
    cookies: ["analyticsdomain.com"],
  },
  ads: {
    description: "Advertising tracking",
    scripts: ["adsdomain.com", "adservice.com"],
    cookies: ["adsdomain.com"],
  },
};

// Default user consent storage (updated based on user choice)
let userConsent = {
  essential: true, // Essential is always true
  analytics: false, // Default to false until user provides consent
  ads: false, // Default to false until user provides consent
};

// Cookie helper functions to manage consent preferences
function setConsentCookie(consent) {
  const consentJSON = JSON.stringify(consent);
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1-year expiry
  document.cookie = `userConsent=${consentJSON}; expires=${expiryDate.toUTCString()}; path=/`;
}

function getConsentCookie() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "userConsent") {
      return JSON.parse(decodeURIComponent(value));
    }
  }
  return null; // No consent found
}

// Block all scripts based on their source until consent is granted
function blockScripts() {
  const scripts = document.querySelectorAll("script[src]");

  scripts.forEach((script) => {
    const category = getCategoryByDomain(script.src, "scripts");
    if (category !== "essential" && !userConsent[category]) {
      // Block the script by changing its type to text/plain
      script.type = "text/plain";
      console.warn(
        `Blocking script from category "${category}": ${script.src}`
      );
    }
  });
}

// Restore and execute scripts when consent is given
function executeAllowedScripts() {
  const blockedScripts = document.querySelectorAll('script[type="text/plain"]');

  blockedScripts.forEach((script) => {
    const category = getCategoryByDomain(script.src, "scripts");
    if (category === "essential" || userConsent[category]) {
      console.log(
        `Executing allowed script from category "${category}": ${script.src}`
      );
      const newScript = document.createElement("script");
      newScript.src = script.src;
      newScript.async = script.async;
      script.replaceWith(newScript); // Replace the old script with a new one to trigger execution
    }
  });
}

// Function to check which category a script or cookie belongs to
function getCategoryByDomain(domain, type) {
  for (const category in consentCategories) {
    const domains = consentCategories[category][type]; // type = 'scripts' or 'cookies'
    for (const consentDomain of domains) {
      if (domain.includes(consentDomain)) {
        return category;
      }
    }
  }
  return "unknown";
}

// Show cookie consent popup if no consent is stored
function showCookieConsentPopup() {
  const consentPopup = document.createElement("div");
  consentPopup.innerHTML = `
      <div style="position:fixed;bottom:0;width:100%;background:white;padding:20px;border-top:1px solid #ccc;padding:20px;">
        <h3>Cookie Consent</h3>
        <p>Select which categories you want to allow:</p>
        <label><input type="checkbox" id="analyticsConsent"> Allow Analytics Cookies & Scripts</label><br>
        <label><input type="checkbox" id="adsConsent"> Allow Ads Cookies & Scripts</label><br>
        <button id="saveConsentBtn">Save Preferences</button>
      </div>
    `;
  document.body.appendChild(consentPopup);

  // Handle the user clicking "Save Preferences"
  document
    .getElementById("saveConsentBtn")
    .addEventListener("click", function () {
      userConsent.analytics =
        document.getElementById("analyticsConsent").checked;
      userConsent.ads = document.getElementById("adsConsent").checked;

      // Save the user consent to a cookie
      setConsentCookie(userConsent);

      // Remove the popup after saving preferences
      consentPopup.remove();

      // Execute allowed scripts after consent is provided
      executeAllowedScripts();

      // Log user preferences for debugging
      console.log("User Consent saved:", userConsent);
    });
}

// Function to start observing new scripts added to the DOM
function observeNewScripts() {
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === "SCRIPT" && node.src) {
          const category = getCategoryByDomain(node.src, "scripts");
          if (category !== "essential" && !userConsent[category]) {
            node.type = "text/plain"; // Block the script by preventing it from executing
            console.warn(
              `Blocking newly added script from category "${category}": ${node.src}`
            );
          }
        }
      });
    });
  });

  // Start observing the document for added <script> elements after DOM is fully loaded
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Ensure DOM is loaded before running the script blocker
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded");
  const savedConsent = getConsentCookie();

  if (savedConsent) {
    // If user preferences are saved, apply them
    userConsent = savedConsent;
    console.log("User Consent loaded from cookie:", userConsent);
    blockScripts();
  } else {
    console.log("No user consent found in cookies");
    // If no preferences are saved, show the consent popup
    showCookieConsentPopup();
  }

  // Start observing newly added scripts
  console.log("Observing new scripts");
  observeNewScripts();
});
