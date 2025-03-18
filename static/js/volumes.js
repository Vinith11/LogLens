document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the volumes grid container
    const volumesGrid = document.querySelector('.volumes-grid');
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'loading';
    loadingIndicator.textContent = 'Loading volumes...';
    volumesGrid.parentNode.insertBefore(loadingIndicator, volumesGrid);
    
    // Fetch volumes from the API
    fetch('/volumes')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            // Clear existing placeholder content
            volumesGrid.innerHTML = '';
            
            // Check if the response is empty
            if (data.length === 0) {
                volumesGrid.innerHTML = '<div class="no-volumes-message">No volumes present in system</div>';
                return;
            }
            
            // Process and display each volume
            data.forEach(volume => {
                // Create volume card HTML
                const volumeCard = document.createElement('div');
                volumeCard.className = 'volume-card';
                
                // Get a readable name - if it's a long hash, shorten it
                let displayName = volume.Name;
                if (displayName.length > 20) {
                    displayName = displayName.substring(0, 12) + '...';
                }
                
                // Create a human-readable mountpoint path
                const mountpoint = volume.Mounted || 'Not mounted';
                
                volumeCard.innerHTML = `
                    <div class="volume-header">
                        <h3>${displayName}</h3>
                        <p class="volume-meta">Scope: ${volume.Scope || 'Unknown'}</p>
                    </div>
                    <div class="volume-details">
                        <p class="volume-driver">Driver: ${volume.Driver || 'Unknown'}</p>
                        <p class="volume-mount">Mountpoint: ${mountpoint}</p>
                    </div>
                    <div class="volume-footer">
                        <p class="volume-name">Full Name: ${volume.Name}</p>
                    </div>
                `;
                
                // Add the card to the grid
                volumesGrid.appendChild(volumeCard);
            });
        })
        .catch(error => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            console.error('Error fetching volumes:', error);
            volumesGrid.innerHTML = '<div class="error-message">Failed to load volumes. Please try again later.</div>';
        });
});