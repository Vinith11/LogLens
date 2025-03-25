// Container details handling script

document.addEventListener("DOMContentLoaded", function () {
  // Get container ID from URL
  function getContainerId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  const containerId = getContainerId();
  if (!containerId) {
    console.error("No container ID found in URL");
    return;
  }

  // State variables
  let containerData = null;
  let currentLogPage = 1;
  let isLoadingMoreLogs = false;
  let hasMoreLogs = true;

  // Initialize container details page
  function initContainerDetails() {
    // Fetch container details for the overview tab
    fetchContainerDetails();

    // Set up tab switching
    setupTabSwitching();

    // Set up action buttons
    setupActionButtons();
  }

  // Fetch container details from API
  function fetchContainerDetails() {
    const containerNameElement = document.getElementById("container-name");
    const containerStatusElement = document.getElementById("container-status");
    const overviewContent = document.getElementById("overview-content");

    if (containerNameElement) {
      containerNameElement.textContent = "Loading...";
    }

    fetch(`/container/${containerId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        containerData = data;

        // Update container name
        if (containerNameElement) {
          // Try to extract a friendly name from the ID or use the short ID
          containerNameElement.textContent = containerId.substring(0, 12);
        }

        // Update container status
        if (containerStatusElement) {
          containerStatusElement.textContent = data.Status;
          containerStatusElement.className = `status ${data.Status.toLowerCase()}`;
        }

        // Update overview content
        if (overviewContent) {
          const detailsHTML = `
                        <div class="container-details">
                            <div class="detail-row">
                                <div class="detail-label">ID</div>
                                <div class="detail-value">${data.ID}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Image</div>
                                <div class="detail-value">${data.Image}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Created</div>
                                <div class="detail-value">${data.Created}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Ports</div>
                                <div class="detail-value">${data.Ports}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Status</div>
                                <div class="detail-value">${data.Status}</div>
                            </div>
                        </div>
                    `;

          document.getElementById("overview-content").innerHTML = detailsHTML;
        }

        // Update action buttons based on container status
        updateActionButtons(data.Status);
      })
      .catch((error) => {
        console.error("Error fetching container details:", error);
        if (containerNameElement) {
          containerNameElement.textContent = "Error loading container";
        }
        if (overviewContent) {
          overviewContent.innerHTML = `<div class="error">Failed to load container details: ${error.message}</div>`;
        }
      });
  }

  // Update action buttons based on container status
  function updateActionButtons(status) {
    const stopButton = document.getElementById("stop-button");

    if (stopButton) {
      if (status.toLowerCase() === "running") {
        stopButton.innerHTML = '<span class="icon">◼</span><span>Stop</span>';
        stopButton.className = "action-button stop-button";
      } else {
        stopButton.innerHTML = '<span class="icon">▶</span><span>Start</span>';
        stopButton.className = "action-button start-button";
      }
    }
  }

  // Fetch container logs
  function fetchContainerLogs(page = 1) {
    const logsContent = document.getElementById("logs-content");

    if (page === 1) {
      logsContent.innerHTML = '<div class="loading">Loading logs...</div>';
    }

    isLoadingMoreLogs = true;

    fetch(`/container-logs/${containerId}?page=${page}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        if (page === 1) {
          logsContent.innerHTML = '<div class="container-logs"></div>';
        }

        const logsContainer = logsContent.querySelector(".container-logs");

        if (!data || data.trim().length === 0) {
          if (page === 1) {
            logsContainer.innerHTML =
              '<div class="no-logs">No logs available</div>';
          }
          hasMoreLogs = false;
          isLoadingMoreLogs = false;
          return;
        }

        // Split logs by new lines and append them correctly
        const logLines = data.split("\n");
        logLines.forEach((log) => {
          if (log.trim().length > 0) {
            const logEntry = document.createElement("div");
            logEntry.className = "log-entry";
            logEntry.textContent = log;
            logsContainer.appendChild(logEntry);
          }
        });

        // Scroll to bottom to show newest logs
        logsContainer.scrollTop = logsContainer.scrollHeight;

        currentLogPage = page;
        isLoadingMoreLogs = false;

        // After initial load, set up the Intersection Observer
        if (page === 1) {
          setupLogScrolling();
        }
      })
      .catch((error) => {
        console.error("Error fetching container logs:", error);
        if (page === 1) {
          logsContent.innerHTML = `<div class="error">Failed to load logs: ${error.message}</div>`;
        }
        isLoadingMoreLogs = false;
      });
  }

  // Setup log scrolling using Intersection Observer (similar to React implementation)
  function setupLogScrolling() {
    const logsContent = document.getElementById("logs-content");
    const logsContainer = document.querySelector(".container-logs");

    if (!logsContainer) return;

    // Create and add sentinel element at the top of logs container
    const sentinel = document.createElement("div");
    sentinel.className = "logs-sentinel";
    sentinel.style.height = "5px"; // Small height to be less intrusive
    sentinel.style.width = "100%";
    logsContainer.prepend(sentinel);

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When sentinel becomes visible and we're not already loading
          if (entry.isIntersecting && !isLoadingMoreLogs && hasMoreLogs) {
            // Save height before loading
            const previousHeight = logsContent.scrollHeight;
            const previousScrollTop = logsContent.scrollTop;

            // Load previous page of logs
            fetchPreviousLogs(
              currentLogPage + 1,
              previousHeight,
              previousScrollTop
            );
          }
        });
      },
      {
        root: logsContent, // Observe intersection relative to logs content div
        threshold: 0.1, // Trigger when at least 10% of sentinel is visible
      }
    );

    // Start observing the sentinel
    observer.observe(sentinel);

    // Store observer reference in a global variable so we can disconnect it later if needed
    window.logsObserver = observer;
  }

  // Function to fetch previous (older) logs
  function fetchPreviousLogs(page, previousHeight, previousScrollTop) {
    const logsContent = document.getElementById("logs-content");
    const logsContainer = document.querySelector(".container-logs");
    const sentinel = document.querySelector(".logs-sentinel");

    if (!logsContainer) return;

    // Add loading indicator right after the sentinel
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-indicator";
    loadingIndicator.textContent = "Loading older logs...";

    if (sentinel && sentinel.nextSibling) {
      logsContainer.insertBefore(loadingIndicator, sentinel.nextSibling);
    } else {
      logsContainer.prepend(loadingIndicator);
    }

    isLoadingMoreLogs = true;

    fetch(`/container-logs/${containerId}?page=${page}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        // Remove loading indicator
        loadingIndicator.remove();

        if (!data || data.trim().length === 0) {
          hasMoreLogs = false;
          const noMoreLogs = document.createElement("div");
          noMoreLogs.className = "no-more-logs";
          noMoreLogs.textContent = "No more logs available";

          // Insert after sentinel
          if (sentinel && sentinel.nextSibling) {
            logsContainer.insertBefore(noMoreLogs, sentinel.nextSibling);
          } else {
            logsContainer.prepend(noMoreLogs);
          }

          isLoadingMoreLogs = false;
          return;
        }

        // Create a document fragment to hold all new log entries
        const fragment = document.createDocumentFragment();

        // Split logs by new lines and create entries
        const logLines = data.split("\n");
        logLines.forEach((log) => {
          if (log.trim().length > 0) {
            const logEntry = document.createElement("div");
            logEntry.className = "log-entry";
            logEntry.textContent = log;
            fragment.appendChild(logEntry);
          }
        });

        // Insert all new log entries after the sentinel
        if (sentinel && sentinel.nextSibling) {
          logsContainer.insertBefore(fragment, sentinel.nextSibling);
        } else {
          // Fallback - just prepend to container
          logsContainer.prepend(fragment);
        }

        // After new content is added, adjust scroll position to maintain the view
        const newHeight = logsContent.scrollHeight;
        const heightDifference = newHeight - previousHeight;
        logsContent.scrollTop = previousScrollTop + heightDifference;

        currentLogPage = page;
        isLoadingMoreLogs = false;
      })
      .catch((error) => {
        console.error("Error fetching previous container logs:", error);
        loadingIndicator.textContent = `Error loading logs: ${error.message}`;
        loadingIndicator.className = "error-indicator";
        isLoadingMoreLogs = false;
      });
  }

  // Setup tab switching
  // In the setupTabSwitching function
  // Add this to your setupTabSwitching function
  function setupTabSwitching() {
    const tabButtons = document.querySelectorAll(".container-tabs .tab-button");

    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const tabId = this.getAttribute("data-tab");

        // Handle specific tab content loading
        if (tabId === "logs") {
          // Fetch logs when logs tab is clicked (setup scrolling is now handled within fetchContainerLogs)
          fetchContainerLogs();

          // Wait a bit for the content to load then scroll to bottom
          setTimeout(() => {
            const logsContainer = document.querySelector(".container-logs");
            if (logsContainer) {
              logsContainer.scrollTop = logsContainer.scrollHeight;
            }
          }, 100);
        } else if (tabId === "stats") {
          // We would fetch stats here in a real implementation
          console.log("Stats tab clicked - would fetch stats data");
        }

        // Switch tab visibility
        switchTab(tabId, this);
      });
    });
  }

  // Set up action buttons
  function setupActionButtons() {
    const stopButton = document.getElementById("stop-button");
    const restartButton = document.getElementById("restart-button");
    const deleteButton = document.getElementById("delete-button");

    // In the setupActionButtons function
    if (stopButton) {
      stopButton.addEventListener("click", function () {
        const isRunning =
          containerData && containerData.Status.toLowerCase() === "running";
        const action = isRunning ? "stop" : "start";
        const endpoint = isRunning
          ? `/container-stop/${containerId}`
          : `/container-start/${containerId}`;

        const confirmMessage = isRunning
          ? "Are you sure you want to stop this container?"
          : "Are you sure you want to start this container?";

        if (confirm(confirmMessage)) {
          // Use the correct endpoint based on the action
          fetch(endpoint, {
            method: "GET",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              // Handle the specific response format you mentioned
              if (data.message) {
                alert(data.message);
              } else {
                alert(`Container ${action}ed successfully`);
              }
              // Refresh container details
              fetchContainerDetails();
            })
            .catch((error) => {
              console.error(`Error ${action}ing container:`, error);
              alert(`Failed to ${action} container: ${error.message}`);
            });
        }
      });
    }

    if (restartButton) {
      restartButton.addEventListener("click", function () {
        if (confirm("Are you sure you want to restart this container?")) {
          // In a real app, you would call an API endpoint to restart the container
          fetch(`/container/${containerId}/restart`, {
            method: "POST",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              alert("Container restarted successfully");
              // Refresh container details
              fetchContainerDetails();
            })
            .catch((error) => {
              console.error("Error restarting container:", error);
              alert(`Failed to restart container: ${error.message}`);
            });
        }
      });
    }

    if (deleteButton) {
      deleteButton.addEventListener("click", function () {
        if (
          confirm(
            "Are you sure you want to delete this container? This action cannot be undone."
          )
        ) {
          // In a real app, you would call an API endpoint to delete the container
          fetch(`/container/${containerId}`, {
            method: "DELETE",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              alert("Container deleted successfully");
              // Redirect to containers page after deletion
              window.location.href = "containers.html";
            })
            .catch((error) => {
              console.error("Error deleting container:", error);
              alert(`Failed to delete container: ${error.message}`);
            });
        }
      });
    }
  }

  // Initialize the page
  initContainerDetails();
});

// Tab switching function - keep this outside the DOMContentLoaded event
// so it can be called from HTML onclick attributes if needed
function switchTab(tabId, buttonElement) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content) => {
    content.classList.remove("active");
  });

  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Show selected tab content
  const tabContent = document.getElementById(`${tabId}-content`);
  if (tabContent) {
    tabContent.classList.add("active");
  }

  // Set the clicked button as active
  buttonElement.classList.add("active");
}
