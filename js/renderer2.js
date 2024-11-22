const BASE_URL = "http://localhost:8080";
let currentPage = 1;
let totalPages = 1;
let employeeToDelete = null;

// ........................... Fetching Employees ........................................ //

async function fetchEmps() {
  try {
    const response = await fetch(`${BASE_URL}/user/page/${currentPage - 1}`);
    if (response.ok) {
      const employees = await response.json();
      populateTable(employees);
      updatePagination();
    } else {
      showError("Failed to fetch employees.");
    }
  } catch (error) {
    showError("Error fetching employees.");
  }
}

function populateTable(employees) {
  const tableBody = document.querySelector("#EmployeeTable tbody");
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  if (employees.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6">No employees found.</td>`;
    tableBody.appendChild(row);
    return;
  }

  const rule = localStorage.getItem("rule");

  employees.forEach((employee) => {
    const row = document.createElement("tr");

    const deleteButton =
      rule === "ADMIN"
        ? `
      <button onclick="openDeleteModal('${employee.email}')">
          <i class="fas fa-trash-alt"></i> Delete
      </button>
    `
        : "";

    const makeAdminButton =
      rule === "ADMIN"
        ? `
      <button onclick="makeAdmin('${employee.email}')">
            <i class="fas fa-user-shield"></i> Make Admin
        </button>
    `
        : "";

    row.innerHTML = `
      <td>${employee.username}</td>
      <td>${employee.email}</td>
      <td>${employee.rule}</td>
      <td class="action-btns">
        ${makeAdminButton}
        ${deleteButton}
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// ........................... Pagination ........................................ //

async function updatePagination() {
  try {
    const response = await fetch(`${BASE_URL}/user/page`);
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
    showError("Error Fetching Number of Pages, Check the server");
  }
}

function changePage(direction) {
  if (direction === "prev" && currentPage > 1) {
    currentPage--;
  } else if (direction === "next" && currentPage < totalPages) {
    currentPage++;
  }
  fetchEmps();
}

document.addEventListener("DOMContentLoaded", () => {
  fetchEmps();
});

// ........................... Deletion ........................................ //

function openDeleteModal(email) {
  employeeToDelete = email;
  document.getElementById(
    "deleteConfirmText"
  ).textContent = `Are you sure you want to delete the Employee: ${email}?`;
  document.getElementById("deleteConfirmModal").style.display = "block";
}

function closeDeleteModal() {
  document.getElementById("deleteConfirmModal").style.display = "none";
  employeeToDelete = null;
}

async function confirmDelete() {
  if (employeeToDelete) {
    try {
      const response = await fetch(
        `${BASE_URL}/user/admin/${employeeToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        showError("Employee has been deleted successfully.");
        fetchEmps();
      } else {
        showError("Failed to delete Employee.");
      }
    } catch (error) {
      showError("Error deleting Employee: " + error);
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

function showSuccess(message) {
  const successAlert = document.getElementById("successAlert");
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

// ........................... Publish Employee as an admin ........................................ //

async function makeAdmin(email) {
  try {
    const response = await fetch(`${BASE_URL}/user/employee/${email}`, {
      method: "PATCH",
    });
    const res = await response.json();
    if (response.ok && res === true) {
      showSuccess(`User ${email} has been an admin`);
      fetchEmps();
    } else if (response.status === 404) {
      showError(`User ${email} not found.`);
    } else {
      showError("Failed to make user an admin.");
    }
  } catch (error) {
    showError(`Error making user an admin: ${error.message}`);
  }
}

// ........................... user Dropdown Menu ........................................ //

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

// ........................... Searchbar ........................................ //

const searchBar = document.getElementById("searchBar");
const paginationControls = document.getElementById("pagination");
searchBar.addEventListener("input", async (event) => {
  const query = event.target.value.trim();

  if (query) {
    try {
      const response = await fetch(`${BASE_URL}/user/search/${query}`);

      if (query) {
        paginationControls.style.display = "none";
      }
      if (response.ok) {
        const filteredEmployees = await response.json();
        populateTable(filteredEmployees);
      } else {
        populateTable([]);
      }
    } catch (error) {
      showError("Error during fetch, Check the server");
      showError("Error searching for Employees.");
    }
  } else {
    paginationControls.style.display = "block";
    fetchEmps();
  }
});

window.onload = fetchEmps;
