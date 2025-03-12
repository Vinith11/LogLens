// containers.js - Tab switching functionality for containers page

document.addEventListener('DOMContentLoaded', function() {
    // Get all tab buttons and container cards
    const tabButtons = document.querySelectorAll('.tab-button');
    const containerCards = document.querySelectorAll('.container-card');
    
    // Add click event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the filter value (all, running, stopped)
            const filterValue = button.getAttribute('data-filter');
            
            // Show/hide containers based on filter
            containerCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-status') === filterValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});