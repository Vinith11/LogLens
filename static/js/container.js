document.addEventListener("DOMContentLoaded", function () {
  // Centralized configuration object
  const config = {
    logs: {
      currentPage: 1,
      isLoading: false,
      hasMoreLogs: true
    }
  };

  // Utility function to get container ID from URL
  const getContainerId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  };

  const containerId = getContainerId();
  if (!containerId) {
    console.error("No container ID found in URL");
    return;
  }

  let containerData = null;
  let currentLogPage = 1;
  let isLoadingMoreLogs = false;
  let hasMoreLogs = true;

  // Create logs view container
  function createLogsView(parentContainer) {
    parentContainer.innerHTML = "";
    const logsView = document.createElement("div");
    logsView.className = "container-logs";
    parentContainer.appendChild(logsView);
    return logsView;
  }

  // Setup infinite scroll
  function setupInfiniteScroll(logsView) {
    logsView.addEventListener("scroll", () => {
      if (
        logsView.scrollTop === 0 &&
        !config.logs.isLoading &&
        config.logs.hasMoreLogs
      ) {
        loadOlderLogs(logsView);
      }
    });
  }

  // Fetch logs with more robust handling
  function fetchLogs(page, logsView, isInitialLoad) {
    if (config.logs.isLoading) return;

    config.logs.isLoading = true;

    // Loading indicator management
    if (isInitialLoad) {
      logsView.innerHTML = '<div class="loading">Loading logs...</div>';
    } else {
      const loadingIndicator = document.createElement("div");
      loadingIndicator.className = "loading-indicator";
      loadingIndicator.textContent = "Loading older logs...";
      logsView.insertBefore(loadingIndicator, logsView.firstChild);
    }

    fetch(`/container-logs/${containerId}?page=${page}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((logData) => {
        // Remove loading indicators
        if (isInitialLoad) {
          logsView.innerHTML = "";
        } else {
          const loadingIndicator = logsView.querySelector(".loading-indicator");
          if (loadingIndicator) loadingIndicator.remove();
        }

        if (!logData || logData.trim().length === 0) {
          config.logs.hasMoreLogs = false;

          logsView.innerHTML = isInitialLoad 
            ? '<div class="no-logs">No logs available</div>' 
            : '<div class="no-more-logs">No more logs available</div>';
          return;
        }

        const logLines = logData.split("\n").filter((line) => line.trim());
        const fragment = document.createDocumentFragment();

        logLines.forEach((log) => {
          const logEntry = document.createElement("div");
          logEntry.className = "log-entry";
          logEntry.textContent = log;

          if (isInitialLoad) {
            fragment.appendChild(logEntry);
          } else {
            fragment.insertBefore(logEntry, fragment.firstChild);
          }
        });

        if (isInitialLoad) {
          logsView.appendChild(fragment);
          logsView.scrollTop = logsView.scrollHeight;
        } else {
          const previousHeight = logsView.scrollHeight;
          logsView.insertBefore(fragment, logsView.firstChild);
          const newHeight = logsView.scrollHeight;
          logsView.scrollTop = newHeight - previousHeight;
        }

        config.logs.currentPage = page;
        config.logs.isLoading = false;
      })
      .catch((error) => {
        console.error("Error fetching logs:", error);
        logsView.innerHTML = `<div class="error">Failed to load logs: ${error.message}</div>`;
        config.logs.isLoading = false;
      });
  }

  // Load initial logs
  function loadInitialLogs(logsView) {
    fetchLogs(1, logsView, true);
  }

  // Load older logs
  function loadOlderLogs(logsView) {
    const nextPage = config.logs.currentPage + 1;
    fetchLogs(nextPage, logsView, false);
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

        if (containerNameElement) {
          containerNameElement.textContent = containerId.substring(0, 12);
        }

        if (containerStatusElement) {
          containerStatusElement.textContent = data.Status;
          containerStatusElement.className = `status ${data.Status.toLowerCase()}`;
        }

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
            logsContainer.innerHTML = '<div class="no-logs">No logs available</div>';
          }
          hasMoreLogs = false;
          isLoadingMoreLogs = false;
          return;
        }

        const logLines = data.split("\n");
        logLines.forEach((log) => {
          if (log.trim().length > 0) {
            const logEntry = document.createElement("div");
            logEntry.className = "log-entry";
            logEntry.textContent = log;
            logsContainer.appendChild(logEntry);
          }
        });

        logsContainer.scrollTop = logsContainer.scrollHeight;

        currentLogPage = page;
        isLoadingMoreLogs = false;

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

  // Setup log scrolling using Intersection Observer
  function setupLogScrolling() {
    const logsContent = document.getElementById("logs-content");
    const logsContainer = document.querySelector(".container-logs");

    if (!logsContainer) return;

    const sentinel = document.createElement("div");
    sentinel.className = "logs-sentinel";
    sentinel.style.height = "5px";
    sentinel.style.width = "100%";
    logsContainer.prepend(sentinel);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoadingMoreLogs && hasMoreLogs) {
            const previousHeight = logsContent.scrollHeight;
            const previousScrollTop = logsContent.scrollTop;

            fetchPreviousLogs(
              currentLogPage + 1,
              previousHeight,
              previousScrollTop
            );
          }
        });
      },
      {
        root: logsContent,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    window.logsObserver = observer;
  }

  // Function to fetch previous (older) logs
  function fetchPreviousLogs(page, previousHeight, previousScrollTop) {
    const logsContent = document.getElementById("logs-content");
    const logsContainer = document.querySelector(".container-logs");
    const sentinel = document.querySelector(".logs-sentinel");

    if (!logsContainer) return;

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
        loadingIndicator.remove();

        if (!data || data.trim().length === 0) {
          hasMoreLogs = false;
          const noMoreLogs = document.createElement("div");
          noMoreLogs.className = "no-more-logs";
          noMoreLogs.textContent = "No more logs available";

          if (sentinel && sentinel.nextSibling) {
            logsContainer.insertBefore(noMoreLogs, sentinel.nextSibling);
          } else {
            logsContainer.prepend(noMoreLogs);
          }

          isLoadingMoreLogs = false;
          return;
        }

        const fragment = document.createDocumentFragment();

        const logLines = data.split("\n");
        logLines.forEach((log) => {
          if (log.trim().length > 0) {
            const logEntry = document.createElement("div");
            logEntry.className = "log-entry";
            logEntry.textContent = log;
            fragment.appendChild(logEntry);
          }
        });

        if (sentinel && sentinel.nextSibling) {
          logsContainer.insertBefore(fragment, sentinel.nextSibling);
        } else {
          logsContainer.prepend(fragment);
        }

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
  function setupTabSwitching() {
    const tabButtons = document.querySelectorAll(".container-tabs .tab-button");

    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const tabId = this.getAttribute("data-tab");

        if (tabId === "logs") {
          config.logs.currentPage = 1;
          config.logs.isLoading = false;
          config.logs.hasMoreLogs = true;

          initLogs();
        } else if (tabId === "stats") {
          console.log("Stats tab clicked - would fetch stats data");
        }

        switchTab(tabId, this);
      });
    });
  }

  // Set up action buttons
  function setupActionButtons() {
    const stopButton = document.getElementById("stop-button");
    const restartButton = document.getElementById("restart-button");
    const deleteButton = document.getElementById("delete-button");

    if (stopButton) {
      stopButton.addEventListener("click", function () {
        const isRunning = containerData && containerData.Status.toLowerCase() === "running";
        const action = isRunning ? "stop" : "start";
        const endpoint = isRunning
          ? `/container-stop/${containerId}`
          : `/container-start/${containerId}`;

        const confirmMessage = isRunning
          ? "Are you sure you want to stop this container?"
          : "Are you sure you want to start this container?";

        if (confirm(confirmMessage)) {
          fetch(endpoint, { method: "GET" })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              if (data.message) {
                alert(data.message);
              } else {
                alert(`Container ${action}ed successfully`);
              }
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
          fetch(`/container/${containerId}/restart`, { method: "POST" })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              alert("Container restarted successfully");
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
        if (confirm("Are you sure you want to delete this container? This action cannot be undone.")) {
          fetch(`/container/${containerId}`, { method: "DELETE" })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              alert("Container deleted successfully");
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

  // Initialize container details page
  function initContainerDetails() {
    fetchContainerDetails();
    setupTabSwitching();
    setupActionButtons();

    const logsContainer = document.getElementById("logs-content");
    const logsView = createLogsView(logsContainer);
    setupInfiniteScroll(logsView);
    loadInitialLogs(logsView);

    const activeLogTab = document.querySelector('.tab-button[data-tab="logs"].active');
    if (activeLogTab) {
      initLogs();
    }
  }

  // Initialize the page
  initContainerDetails();
});

// Tab switching function
function switchTab(tabId, buttonElement) {
  const tabContents = document.querySelectorAll(".tab-content");
  const tabButtons = document.querySelectorAll(".tab-button");

  tabContents.forEach((content) => content.classList.remove("active"));
  tabButtons.forEach((button) => button.classList.remove("active"));

  const tabContent = document.getElementById(`${tabId}-content`);
  if (tabContent) tabContent.classList.add("active");

  buttonElement.classList.add("active");
}