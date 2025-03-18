document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the images grid container
    const imagesGrid = document.querySelector('.images-grid');
    
    // Fetch images from the API
    fetch('/images')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Clear existing placeholder content
            imagesGrid.innerHTML = '';
            
            // Check if the response is empty
            if (data.length === 0) {
                imagesGrid.innerHTML = '<div class="no-images-message">No images present in system</div>';
                return;
            }
            
            // Process and display each image
            data.forEach(image => {
                // Format the creation date
                const createdDate = new Date(image.Created * 1000); // Convert Unix timestamp to JS date
                const now = new Date();
                const diffTime = Math.abs(now - createdDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                let timeAgo;
                if (diffDays === 0) {
                    timeAgo = 'Today';
                } else if (diffDays === 1) {
                    timeAgo = 'Yesterday';
                } else if (diffDays < 7) {
                    timeAgo = diffDays + ' days ago';
                } else if (diffDays < 30) {
                    const weeks = Math.floor(diffDays / 7);
                    timeAgo = weeks === 1 ? '1 week ago' : weeks + ' weeks ago';
                } else {
                    const months = Math.floor(diffDays / 30);
                    timeAgo = months === 1 ? '1 month ago' : months + ' months ago';
                }
                
                // Format the size (convert bytes to MB or KB)
                let sizeDisplay;
                if (image.Size >= 1048576) { // 1MB = 1048576 bytes
                    sizeDisplay = (image.Size / 1048576).toFixed(2) + 'MB';
                } else if (image.Size >= 1024) {
                    sizeDisplay = (image.Size / 1024).toFixed(2) + 'KB';
                } else {
                    sizeDisplay = image.Size + 'B';
                }
                
                // Create image card HTML
                const imageCard = document.createElement('div');
                imageCard.className = 'image-card';
                
                // Use the first RepoTag if available, otherwise use the ID
                const imageName = image.RepoTags && image.RepoTags.length > 0 
                    ? image.RepoTags[0] 
                    : image.ID.substring(7, 19); // shortened ID
                
                imageCard.innerHTML = `
                    <div class="image-header">
                        <h3>${imageName}</h3>
                        <p class="image-meta">Created ${timeAgo}</p>
                    </div>
                    <div class="image-details">
                        <p class="image-id">ID: ${image.ID.substring(7, 19)}...</p>
                        <p class="image-size">Size: ${sizeDisplay}</p>
                    </div>
                `;
                
                // Add the card to the grid
                imagesGrid.appendChild(imageCard);
            });
        })
        .catch(error => {
            console.error('Error fetching images:', error);
            imagesGrid.innerHTML = '<div class="error-message">Failed to load images. Please try again later.</div>';
        });
});