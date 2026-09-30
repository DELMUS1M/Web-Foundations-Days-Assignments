const loadBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusMsg = document.getElementById('status');
const usersList = document.getElementById('users-list');

let usersArray = [];

// Fetch users from API
async function loadUsers() {
  loadBtn.disabled = true;
  statusMsg.textContent = "Loading users...";
  usersList.textContent = ""; 

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    usersArray = await response.json();
    statusMsg.textContent = "Users loaded successfully!";
    renderUsers(usersArray);

  } catch (error) {
    statusMsg.textContent = `Failed to load users: ${error.message}`;
  } finally {
    loadBtn.disabled = false;
  }
}

// Render the user list to the DOM
function renderUsers(list) {
  usersList.textContent = ""; 

  if (list.length === 0) {
    statusMsg.textContent = "No users match your filter.";
    return;
  } else if (usersArray.length > 0 && statusMsg.textContent === "No users match your filter.") {
    // Reset status if matches are found again
    statusMsg.textContent = "Users loaded successfully!";
  }

  list.forEach(user => {
    const li = document.createElement('li');
    li.className = 'user-card';

    const nameEl = document.createElement('h3');
    nameEl.textContent = user.name;

    const emailEl = document.createElement('p');
    emailEl.textContent = `Email: ${user.email}`;

    const cityEl = document.createElement('p');
    cityEl.textContent = `City: ${user.address.city}`;

    const companyEl = document.createElement('p');
    companyEl.textContent = `Company: ${user.company.name}`;

    li.appendChild(nameEl);
    li.appendChild(emailEl);
    li.appendChild(cityEl);
    li.appendChild(companyEl);

    usersList.appendChild(li);
  });
}

// Event Listeners
loadBtn.addEventListener('click', loadUsers);

filterInput.addEventListener('input', (event) => {
  const filterText = event.target.value.toLowerCase();
  
  const filteredUsers = usersArray.filter(user => 
    user.name.toLowerCase().includes(filterText)
  );
  
  renderUsers(filteredUsers);
});
