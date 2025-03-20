// Constants
const API_URL = "https://cors-anywhere.herokuapp.com/http://services.odata.org/TripPinRESTierService/People";
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// State
let currentPage = 1;
let itemsPerPage = PAGE_SIZE_OPTIONS[1]; // Default to 10
let totalCount = 0;
let sortCriteria = [];
let filterCriteria = [];

// DOM Elements
const tableBody = document.getElementById("table-body");
const pagination = document.getElementById("pagination");
const sortBtn = document.getElementById("sort-btn");
const filterBtn = document.getElementById("filter-btn");
const refreshBtn = document.getElementById("refresh-btn");
const sortPopup = document.getElementById("sort-popup");
const filterPopup = document.getElementById("filter-popup");
const addSortBtn = document.getElementById("add-sort");
const addFilterBtn = document.getElementById("add-filter");
const submitSortBtn = document.getElementById("submit-sort");
const submitFilterBtn = document.getElementById("submit-filter");
const resetSortBtn = document.getElementById("reset-sort");
const resetFilterBtn = document.getElementById("reset-filter");
const sortFields = document.getElementById("sort-fields");
const filterFields = document.getElementById("filter-fields");
const loadingSpinner = document.getElementById("loading-spinner");

// Utility Functions
const showLoadingSpinner = () => {
    loadingSpinner.style.display = "flex";
};

const hideLoadingSpinner = () => {
    loadingSpinner.style.display = "none";
};

const updateSortButton = () => {
    if (sortCriteria.length > 0) {
        sortBtn.className = "active-btn";
        sortBtn.innerHTML = `${sortCriteria.length} <u>Sort</u> <span class="reset-icon"><img src="images/close.svg" alt="close"></span>`;
        sortBtn.querySelector(".reset-icon").addEventListener("click", (e) => {
            e.stopPropagation();
            resetSortBtn.click();
        });
    } else {
        sortBtn.className = "action-btn sort-btn";
        sortBtn.innerHTML = '<img src="images/sort-icon.svg" alt="sort"> Sort';
    }
};

const updateFilterButton = () => {
    if (filterCriteria.length > 0) {
        filterBtn.className = "active-btn";
        filterBtn.innerHTML = `${filterCriteria.length} <u>Filter</u> <span class="reset-icon"><img src="images/close.svg" alt="close"></span>`;
        filterBtn.querySelector(".reset-icon").addEventListener("click", (e) => {
            e.stopPropagation();
            resetFilterBtn.click();
        });
    } else {
        filterBtn.className = "action-btn filter-btn";
        filterBtn.innerHTML = '<img src="images/filter-icon.svg" alt="filter"> Filter';
    }
};

// Fetch Data from OData API
const fetchData = async (page = 1) => {
    showLoadingSpinner();
    const skip = (page - 1) * itemsPerPage;
    let query = `${API_URL}?$top=${itemsPerPage}&$skip=${skip}&$select=UserName,FirstName,LastName,MiddleName,Gender,Age&$count=true`;

    // Add sorting
    if (sortCriteria.length > 0) {
        const orderBy = sortCriteria.map(c => `${c.field} ${c.direction}`).join(",");
        query += `&$orderby=${orderBy}`;
    }

    // Add filtering
    if (filterCriteria.length > 0) {
        const filters = filterCriteria.map(c => {
            const field = c.field;
            const value = c.value;
            const operator = c.operator;

            // Case-insensitive filtering for strings
            if (["UserName", "FirstName", "LastName", "MiddleName", "Gender"].includes(field)) {
                switch (operator) {
                    case "eq":
                        return `tolower(${field}) eq tolower('${value}')`;
                    case "startsWith":
                        return `startswith(tolower(${field}), tolower('${value}'))`;
                    case "endsWith":
                        return `endswith(tolower(${field}), tolower('${value}'))`;
                    case "includes":
                        return `contains(tolower(${field}), tolower('${value}'))`;
                    default:
                        return "";
                }
            } else if (field === "Age") {
                // Numeric comparisons for Age
                switch (operator) {
                    case "eq":
                        return `${field} eq ${value}`;
                    case "gt":
                        return `${field} gt ${value}`;
                    case "lt":
                        return `${field} lt ${value}`;
                    default:
                        return "";
                }
            }
            return "";
        }).filter(f => f).join(" and ");

        if (filters) {
            query += `&$filter=${filters}`;
        }
    }

    try {
        const response = await fetch(query);
        const data = await response.json();
        totalCount = data["@odata.count"] || 0;
        renderTable(data.value);
        renderPagination(page);
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        hideLoadingSpinner();
    }
};

// Render Table
const renderTable = (data) => {
    tableBody.innerHTML = "";
    data.forEach(person => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${person.UserName || "N/A"}</td>
            <td>${person.FirstName || "N/A"}</td>
            <td>${person.LastName || "N/A"}</td>
            <td>${person.MiddleName || "N/A"}</td>
            <td>${person.Gender || "N/A"}</td>
            <td>${person.Age || "N/A"}</td>
        `;
        tableBody.appendChild(row);
    });
};

// Render Pagination
const renderPagination = (currentPage) => {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.className = "page-btn";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchData(currentPage);
        }
    });

    const pageInfo = document.createElement("span");
    pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "page-btn";
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchData(currentPage);
        }
    });

    const pageSizeSelect = document.createElement("select");
    PAGE_SIZE_OPTIONS.forEach(size => {
        const option = document.createElement("option");
        option.value = size;
        option.textContent = `${size} per page`;
        if (size === itemsPerPage) option.selected = true;
        pageSizeSelect.appendChild(option);
    });
    pageSizeSelect.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        fetchData(currentPage);
    });

    pagination.appendChild(prevBtn);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextBtn);
    pagination.appendChild(pageSizeSelect);
};

// Popup Management
const openPopup = (popup) => {
    popup.style.display = "block";
};

const closePopup = () => {
    sortPopup.style.display = "none";
    filterPopup.style.display = "none";
};

// Sort Popup Logic
const addSortField = () => {
    const div = document.createElement("div");
    div.className = "sort-field";
    div.innerHTML = `
        <select>
            <option value="UserName">Username</option>
            <option value="FirstName">First Name</option>
            <option value="LastName">Last Name</option>
            <option value="MiddleName">Middle Name</option>
            <option value="Gender">Gender</option>
            <option value="Age">Age</option>
        </select>
        <select>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
        </select>
        <button onclick="this.parentElement.remove()"><img src="images/trash-can-icon.svg" alt="delete"></button>
    `;
    sortFields.appendChild(div);
};

// Filter Popup Logic
const addFilterField = () => {
    const div = document.createElement("div");
    div.className = "filter-field";
    div.innerHTML = `
        <select class="field-select">
            <option value="UserName">Username</option>
            <option value="FirstName">First Name</option>
            <option value="LastName">Last Name</option>
            <option value="MiddleName">Middle Name</option>
            <option value="Gender">Gender</option>
            <option value="Age">Age</option>
        </select>
        <select class="operator-select">
            <option value="eq">Equal To</option>
            <option value="startsWith">Starts With</option>
            <option value="endsWith">Ends With</option>
            <option value="includes">Includes</option>
            <option value="gt">Greater Than</option>
            <option value="lt">Less Than</option>
        </select>
        <input type="text" placeholder="Value">
        <button onclick="this.parentElement.remove()"><img src="images/trash-can-icon.svg" alt="delete"></button>
    `;

    // Dynamically update operator options based on the selected field
    const fieldSelect = div.querySelector(".field-select");
    const operatorSelect = div.querySelector(".operator-select");

    const updateOperatorOptions = () => {
        const field = fieldSelect.value;
        operatorSelect.innerHTML = "";
        const stringOperators = [
            { value: "eq", text: "Equal To" },
            { value: "startsWith", text: "Starts With" },
            { value: "endsWith", text: "Ends With" },
            { value: "includes", text: "Includes" }
        ];
        const numericOperators = [
            { value: "eq", text: "Equal To" },
            { value: "gt", text: "Greater Than" },
            { value: "lt", text: "Less Than" }
        ];

        const operators = field === "Age" ? numericOperators : stringOperators;
        operators.forEach(op => {
            const option = document.createElement("option");
            option.value = op.value;
            option.textContent = op.text;
            operatorSelect.appendChild(option);
        });
    };

    fieldSelect.addEventListener("change", updateOperatorOptions);
    updateOperatorOptions(); // Initial call to set correct operators
    filterFields.appendChild(div);
};

// Event Listeners
addSortBtn.addEventListener("click", addSortField);

addFilterBtn.addEventListener("click", addFilterField);

submitSortBtn.addEventListener("click", () => {
    sortCriteria = [];
    sortFields.querySelectorAll(".sort-field").forEach(div => {
        const field = div.querySelector("select:nth-child(1)").value;
        const direction = div.querySelector("select:nth-child(2)").value;
        sortCriteria.push({ field, direction });
    });
    fetchData(currentPage);
    updateSortButton();
    closePopup();
});

resetSortBtn.addEventListener("click", () => {
    sortCriteria = [];
    sortFields.innerHTML = "";
    fetchData(currentPage);
    updateSortButton();
});

submitFilterBtn.addEventListener("click", () => {
    filterCriteria = [];
    filterFields.querySelectorAll(".filter-field").forEach(div => {
        const field = div.querySelector(".field-select").value;
        const operator = div.querySelector(".operator-select").value;
        const value = div.querySelector("input").value;
        if (value) {
            filterCriteria.push({ field, operator, value });
        }
    });
    currentPage = 1;
    fetchData(currentPage);
    updateFilterButton();
    closePopup();
});

resetFilterBtn.addEventListener("click", () => {
    filterCriteria = [];
    filterFields.innerHTML = "";
    fetchData(currentPage);
    updateFilterButton();
});

sortBtn.addEventListener("click", () => {
    openPopup(sortPopup);
});

filterBtn.addEventListener("click", () => {
    openPopup(filterPopup);
});

refreshBtn.addEventListener("click", () => {
    currentPage = 1;
    sortCriteria = [];
    filterCriteria = [];
    sortFields.innerHTML = "";
    filterFields.innerHTML = "";
    fetchData(currentPage);
    updateSortButton();
    updateFilterButton();
});

document.querySelectorAll(".cancel").forEach(btn => {
    btn.addEventListener("click", closePopup);
});

// Initial Load
fetchData(currentPage);
updateSortButton();
updateFilterButton();