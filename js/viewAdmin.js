const BASE_URL = "http://localhost:8080"; // Ensure to use the correct base URL
let currentPage = 1; // Start on page 1
let totalPages = 1; // Default total pages (we will get this from the backend)
let adminsToDelete = null;

document.addEventListener("DOMContentLoaded", () => {
  fetchAdmins();
});

async function fetchAdmins() {
  try {
    const response = await fetch(
      `${BASE_URL}/user/admin/page/${currentPage - 1}`
    );
    if (response.ok) {
      const admins = await response.json();
      populateTable(admins);
      updatePagination();
    } else {
      showError("Failed to fetch admins.");
    }
  } catch (error) {
    showError("Error fetching admins.");
  }
}

function populateTable(admins) {
  const tableBody = document.querySelector("#AdminTable tbody");
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  if (admins.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6">No admins found.</td>`;
    tableBody.appendChild(row);
    return;
  }

  const rule = localStorage.getItem("rule");

  admins.forEach((admin) => {
    const row = document.createElement("tr");

    const deleteButton =
      rule === "ADMIN"
        ? `
      <button onclick="openDeleteModal('${admin.email}')">
          <i class="fas fa-trash-alt"></i> Delete
      </button>
    `
        : "";

    const removeAdminButton =
      rule === "ADMIN"
        ? `
      <button onclick="removeAdmin('${admin.email}')">
      <i class="fas fa-user-minus"></i> Remove Admin
    </button>
    `
        : "";

    row.innerHTML = `
      <td>${admin.username}</td>
      <td>${admin.email}</td>
      <td>${admin.rule}</td>
      <td class="action-btns">
        ${removeAdminButton}
        ${deleteButton}
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// ........................... Pagination ........................................ //

async function updatePagination() {
  try {
    const response = await fetch(`${BASE_URL}/user/admin/page`);
    if (response.ok) {
      totalPages = await response.json();
      document.getElementById(
        "currentPage"
      ).textContent = `Page ${currentPage} of ${totalPages}`;
      document.getElementById("prevPageBtn").disabled = currentPage === 1;
      document.getElementById("nextPageBtn").disabled =
        currentPage === totalPages;
    }
  } catch (error) {
    showError("Error fetching total pages, Check the Server");
  }
}

function changePage(direction) {
  if (direction === "prev" && currentPage > 1) {
    currentPage--;
  } else if (direction === "next" && currentPage < totalPages) {
    currentPage++;
  }
  fetchAdmins();
}

// ........................... Searchbar ........................................ //

const searchBar = document.getElementById("searchBar");
const paginationControls = document.getElementById("pagination");
searchBar.addEventListener("input", async (event) => {
  const query = event.target.value.trim();

  if (query) {
    try {
      const response = await fetch(`${BASE_URL}/user/admin/search/${query}`);

      if (query) {
        paginationControls.style.display = "none";
      }
      if (response.ok) {
        const filteredAdmins = await response.json();
        populateTable(filteredAdmins);
      } else {
        populateTable([]);
      }
    } catch (error) {
      showError("Error during fetch, Check the Server");
      showError("Error searching for Employees.");
    }
  } else {
    paginationControls.style.display = "block";
    fetchAdmins();
  }
});

// ...........................user Dropdown Menu ........................................ //
document.addEventListener("DOMContentLoaded", () => {
  const userIcon = document.getElementById("userdrop");
  const userDropdown = document.getElementById("userDropdown");

  userIcon.addEventListener("click", () => {
    if (userDropdown.style.display === "block") {
      userDropdown.style.display = "none";
    } else {
      userDropdown.style.display = "block";
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !userIcon.contains(event.target) &&
      !userDropdown.contains(event.target)
    ) {
      userDropdown.style.display = "none";
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    localStorage.setItem("isLoggedIn", "false");
    localStorage.removeItem("username");

    const alertBox = document.createElement("div");
    alertBox.className = "alert-box2";
    alertBox.textContent = "Logging out...";

    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.remove();
      window.location.href = "login.html";
    }, 1500);
  });
});

const viewEmps = document.getElementById("viewEmps");
viewEmps.addEventListener("click", () => {
  window.location.href = "employees.html";
});
viewAdmins.addEventListener("click", () => {
  window.location.href = "viewAdmins.html";
});

async function removeAdmin(email) {
  try {
    const response = await fetch(`${BASE_URL}/user/admin/${email}`, {
      method: "PATCH",
    });
    const res = await response.json();
    if (response.ok && res === true) {
      showSuccess(`Admin ${email} has been removed`);
      fetchAdmins();
    } else if (response.status === 404) {
      showError(`User ${email} not found.`);
    } else {
      showError("Failed to remove Admin");
    }
  } catch (error) {
    showError(`Error making removing an admin: ${error.message}`);
  }
}

function showSuccess(message) {
  const successAlert = document.getElementById("successAlertDeletion");
  successAlert.textContent = message;
  successAlert.style.display = "block";
  setTimeout(() => {
    successAlert.style.display = "none";
  }, 3000);
}

function showError(message) {
  const errorAlert = document.getElementById("errorAlert");
  errorAlert.textContent = message;
  errorAlert.style.display = "block";
  setTimeout(() => {
    errorAlert.style.display = "none";
  }, 3000);
}

// ........................... Deletion ........................................ //

function openDeleteModal(email) {
  adminsToDelete = email;
  document.getElementById(
    "deleteConfirmText"
  ).textContent = `Are you sure you want to delete Admin: ${email}?\nThat will cause removing all data for that user`;
  document.getElementById("deleteConfirmModal").style.display = "block";
}

function closeDeleteModal() {
  document.getElementById("deleteConfirmModal").style.display = "none";
  adminsToDelete = null;
}

async function confirmDelete() {
  if (adminsToDelete) {
    try {
      const response = await fetch(`${BASE_URL}/user/admin/${adminsToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showError("Admin has been deleted successfully.");
        fetchAdmins();
      } else {
        showError("Failed to delete Admin.");
      }
    } catch (error) {
      showError("Error deleting Admin: " + error);
    } finally {
      closeDeleteModal();
    }
  }
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", confirmDelete);
document
  .getElementById("cancelDeleteBtn")
  .addEventListener("click", closeDeleteModal);
