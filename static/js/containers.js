function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const containersGrid = document.querySelector('.containers-grid');
    
    // Default load "all" containers
    fetchContainers('all');
    
    // Loop through each button and set onclick directly
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].onclick = function() {
            // Remove active class from all buttons
            for (let j = 0; j < tabButtons.length; j++) {
                tabButtons[j].classList.remove('active');
            }
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value (all, running, stopped)
            const filterValue = this.getAttribute('data-filter');
            
            // Fetch containers based on filter
            fetchContainers(filterValue);
        };
    }
}

function fetchContainers(filter) {
    const containersGrid = document.querySelector('.containers-grid');
    containersGrid.innerHTML = '<div class="loading">Loading containers...</div>';
    
    fetch(`/containers?filter=${filter}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            containersGrid.innerHTML = '';
            if (!data.containers || data.containers.length === 0) {
                containersGrid.innerHTML = '<div class="no-containers">No containers available</div>';
                return;
            }
            
            data.containers.forEach(container => {
                const containerCard = createContainerCard(container);
                containersGrid.appendChild(containerCard);
            });
        })
        .catch(error => {
            console.error('Error fetching containers:', error);
            containersGrid.innerHTML = '<div class="error">Failed to load containers. Please try again.</div>';
        });
}

function createContainerCard(container) {
    const card = document.createElement('div');
    card.className = 'container-card';
    card.setAttribute('data-status', container.State.toLowerCase());
    
    const containerName = container.Names && container.Names.length > 0 
        ? container.Names[0].replace('/', '') 
        : container.ID;
    
    card.innerHTML = `
        <div class="container-header">
            <h3>${containerName}</h3>
            <p class="container-image">${container.Image}</p>
        </div>
        <div class="container-footer">
            <span class="status ${container.State.toLowerCase()}">${container.State.toLowerCase()}</span>
            <span class="container-id">${container.ID}</span>
        </div>
    `;
    
    return card;
}

// Call the function immediately on page load
initializeTabs();
