document.addEventListener('DOMContentLoaded', function() {
    // Fetch dashboard data
    fetchDashboardData();
    
    // Function to fetch dashboard data
    function fetchDashboardData() {
        fetch('http://localhost:8080/dashboard')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                updateDashboard(data);
            })
            .catch(error => {
                console.error('Error fetching dashboard data:', error);
                showErrorMessage('Failed to load dashboard data. Please refresh the page or try again later.');
            });
    }
    
    // Function to update dashboard with fetched data
    function updateDashboard(data) {
        // Update total containers count
        document.querySelector('.card:nth-child(1) .metric').textContent = data.totalContainers;
        
        // Update running containers count
        document.querySelector('.card:nth-child(2) .metric').textContent = data.totalRunningContainers;
        
        // Update running containers section
        updateRunningContainers(data.containers);
    }
    
    // Function to update the running containers section
    function updateRunningContainers(containers) {
        const containerGrid = document.querySelector('.container-grid');
        
        // Clear existing containers
        containerGrid.innerHTML = '';
        
        // Check if there are running containers
        const runningContainers = containers.filter(container => container.State.toLowerCase() === 'running');
        
        if (runningContainers.length === 0) {
            containerGrid.innerHTML = '<div class="no-containers">No running containers available</div>';
            return;
        }
        
        // Create container cards for each running container
        runningContainers.forEach(container => {
            const containerName = container.Names && container.Names.length > 0 
                ? container.Names[0].replace('/', '') 
                : container.ID;
                
            const containerCard = document.createElement('div');
            containerCard.className = 'container-card';
            
            containerCard.innerHTML = `
                <div class="container-header">
                    <h3>${containerName}</h3>
                    <p class="container-image">${container.Image}</p>
                </div>
                <div class="container-footer">
                    <span class="status running">running</span>
                    <span class="container-id">${container.ID}</span>
                </div>
            `;
            
            containerGrid.appendChild(containerCard);
        });
    }
    
    // Function to show error message
    function showErrorMessage(message) {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        errorMessage.style.color = 'red';
        errorMessage.style.padding = '10px';
        errorMessage.style.marginTop = '10px';
        
        dashboardGrid.insertAdjacentElement('beforebegin', errorMessage);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorMessage.remove();
        }, 5000);
    }
    
    // Refresh dashboard data every 30 seconds
    setInterval(fetchDashboardData, 30000);
});