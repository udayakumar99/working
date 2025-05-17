let assets = [];
let assignments = [];
let resignedDevelopers = []; // Store history of resigned developers
let userSettings = {
  name: "",
  email: "",
  notifyAssign: false,
  notifyReturn: false,
  notifyDamage: false
};

document.getElementById("assetForm").addEventListener("submit", function (e) {
  e.preventDefault();
  try {
    const type = document.getElementById("addAssetType").value;
    const brand = document.getElementById("assetBrand").value.trim();
    const serial = document.getElementById("serialNumber").value.trim();
    
    // Validate required fields
    if (!type || !brand || !serial) {
      alert("Error: All fields are required!");
      return;
    }
    
    // Validate serial number uniqueness
    if (assets.some(a => a.serial === serial)) {
      alert("Error: An asset with this serial number already exists!");
      return;
    }

    const asset = {
      type,
      brand,
      serial,
      config: document.getElementById("configuration")?.value?.trim() || "",
      storage: document.getElementById("storage")?.value?.trim() || "",
      damaged: "No",
      resolution: type === "Webcam" ? document.getElementById("webcamResolution")?.value?.trim() || "" : "",
      framerate: type === "Webcam" ? document.getElementById("webcamFramerate")?.value?.trim() || "" : "",
      camType: type === "Webcam" ? document.getElementById("webcamType")?.value?.trim() || "" : "",
      assigned: false,
      dateAdded: new Date().toISOString()
    };
    
    // Validate webcam-specific fields if type is webcam
    if (type === "Webcam" && (!asset.resolution || !asset.framerate || !asset.camType)) {
      alert("Error: All webcam fields are required when adding a webcam!");
      return;
    }

    assets.push(asset);
    alert("Asset added successfully!");
    this.reset();
    updateSummary();
  } catch (error) {
    console.error("Error adding asset:", error);
    alert("Failed to add asset. Please try again.");
  }
});

document.getElementById("assignForm").addEventListener("submit", function (e) {
  e.preventDefault();
  try {
    const serial = document.getElementById("assignSerial").value.trim();
    const developerName = document.getElementById("developerName").value.trim();
    const developerId = document.getElementById("developerId").value.trim();

    // Validate required fields
    if (!serial || !developerName || !developerId) {
      alert("Error: All fields are required!");
      return;
    }

    // Check if developer already has an assigned asset
    if (assignments.some(a => a.id === developerId)) {
      alert("Error: This developer already has an assigned asset!");
      return;
    }

    const asset = assets.find(a => a.serial === serial && !a.assigned);
    if (!asset) {
      alert("Error: Asset not found or already assigned!");
      return;
    }

    const developer = {
      name: developerName,
      id: developerId,
      asset,
      dateAssigned: new Date().toISOString()
    };
    asset.assigned = true;
    assignments.push(developer);
    updateAssignmentTable();
    updateSummary();

    if (userSettings.notifyAssign) {
      alert("📧 Email notification: Asset assigned to developer.");
    }

    this.reset();
  } catch (error) {
    console.error("Error assigning asset:", error);
    alert("Failed to assign asset. Please try again.");
  }
});

document.getElementById("returnForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const input = document.getElementById("returnIdentifier").value.trim().toLowerCase();
  const index = assignments.findIndex(d => d.name.toLowerCase() === input || d.id.toLowerCase() === input);
  if (index === -1) return alert("No asset found for given developer!");

  // Store resigned developer info
  const resignedDev = assignments[index];
  resignedDevelopers.push({
    name: resignedDev.name,
    id: resignedDev.id,
    lastAsset: resignedDev.asset,
    resignationDate: new Date().toISOString()
  });

  assignments[index].asset.assigned = false;
  assignments.splice(index, 1);
  updateAssignmentTable();
  updateSummary();
  updateResignedTable();

  if (userSettings.notifyReturn) {
    alert("📧 Email notification: Asset returned.");
  }

  alert("Asset returned successfully.");
  this.reset();
});

document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const input = document.getElementById("searchInput").value.trim().toLowerCase();
  const result = document.getElementById("searchResult");
  
  // Search in assignments first
  const assignedMatch = assignments.find(d =>
    d.asset.serial.toLowerCase() === input ||
    d.name.toLowerCase() === input ||
    d.id.toLowerCase() === input
  );

  // Search in unassigned assets
  const unassignedMatch = assets.find(a => 
    !a.assigned && (
      a.serial.toLowerCase() === input ||
      a.brand.toLowerCase().includes(input) ||
      a.type.toLowerCase().includes(input)
    )
  );

  if (!assignedMatch && !unassignedMatch) {
    result.innerHTML = `<div class="alert alert-warning">No matching record found for: <strong>${input}</strong></div>`;
    return;
  }

  if (assignedMatch) {
    result.innerHTML = `
      <div class="p-3 bg-light border rounded">
        <h5 class="text-success">Assigned Asset Found:</h5>
        <p><strong>Developer:</strong> ${assignedMatch.name}</p>
        <p><strong>Developer ID:</strong> ${assignedMatch.id}</p>
        <p><strong>Type:</strong> ${assignedMatch.asset.type}</p>
        <p><strong>Brand:</strong> ${assignedMatch.asset.brand}</p>
        <p><strong>Serial:</strong> ${assignedMatch.asset.serial}</p>
        <p><strong>Configuration:</strong> ${assignedMatch.asset.config}</p>
        <p><strong>Storage:</strong> ${assignedMatch.asset.storage}</p>
        ${assignedMatch.asset.type === 'Webcam' ? `
          <p><strong>Resolution:</strong> ${assignedMatch.asset.resolution}</p>
          <p><strong>Frame Rate:</strong> ${assignedMatch.asset.framerate}</p>
          <p><strong>Webcam Type:</strong> ${assignedMatch.asset.camType}</p>
        ` : ''}
        <p><strong>Damaged:</strong> ${assignedMatch.asset.damaged}</p>
        <p><strong>Status:</strong> <span class="badge bg-primary">Assigned</span></p>
      </div>`;
  } else {
    result.innerHTML = `
      <div class="p-3 bg-light border rounded">
        <h5 class="text-info">Unassigned Asset Found:</h5>
        <p><strong>Type:</strong> ${unassignedMatch.type}</p>
        <p><strong>Brand:</strong> ${unassignedMatch.brand}</p>
        <p><strong>Serial:</strong> ${unassignedMatch.serial}</p>
        <p><strong>Configuration:</strong> ${unassignedMatch.config}</p>
        <p><strong>Storage:</strong> ${unassignedMatch.storage}</p>
        ${unassignedMatch.type === 'Webcam' ? `
          <p><strong>Resolution:</strong> ${unassignedMatch.resolution}</p>
          <p><strong>Frame Rate:</strong> ${unassignedMatch.framerate}</p>
          <p><strong>Webcam Type:</strong> ${unassignedMatch.camType}</p>
        ` : ''}
        <p><strong>Damaged:</strong> ${unassignedMatch.damaged}</p>
        <p><strong>Status:</strong> <span class="badge bg-success">Available</span></p>
      </div>`;
  }
});

function updateAssignmentTable() {
  try {
    const table = document.getElementById("assignmentTable");
    if (!table) {
      console.error("Assignment table not found");
      return;
    }
    
    table.innerHTML = "";
    assignments.forEach((a, i) => {
      table.innerHTML += `
        <tr class="text-center">
          <td>${i + 1}</td>
          <td>${a.name}</td>
          <td>${a.id}</td>
          <td>${a.asset.type}</td>
          <td>${a.asset.brand}</td>
          <td>${a.asset.serial}</td>
          <td>${a.asset.config || 'N/A'}</td>
          <td>${a.asset.damaged}</td>
          <td><span class="badge bg-success">Active</span></td>
          <td>
            <button class="btn btn-sm btn-info" onclick="viewHistory('${a.asset.serial}')" data-bs-toggle="modal" data-bs-target="#historyModal">📋</button>
            <button class="btn btn-sm btn-warning" onclick="reportIssue('${a.asset.serial}')">⚠️</button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error updating assignment table:", error);
  }
}

function updateSummary() {
  try {
    const elements = {
      total: document.getElementById("totalAssets"),
      available: document.getElementById("availableAssets"),
      assigned: document.getElementById("assignedAssets"),
      damaged: document.getElementById("damagedAssets")
    };

    // Check if all elements exist
    for (const [key, element] of Object.entries(elements)) {
      if (!element) {
        console.error(`${key} element not found`);
        return;
      }
    }

    elements.total.innerText = assets.length;
    elements.available.innerText = assets.filter(a => !a.assigned).length;
    elements.assigned.innerText = assets.filter(a => a.assigned).length;
    elements.damaged.innerText = assets.filter(a => a.damaged === "Yes").length;
  } catch (error) {
    console.error("Error updating summary:", error);
  }
}

// Settings Save
document.getElementById("settingsForm").addEventListener("submit", function (e) {
  e.preventDefault();
  userSettings.name = document.getElementById("userName").value.trim();
  userSettings.email = document.getElementById("userEmail").value.trim();
  userSettings.notifyAssign = document.getElementById("notifyAssign").checked;
  userSettings.notifyReturn = document.getElementById("notifyReturn").checked;
  userSettings.notifyDamage = document.getElementById("notifyDamage").checked;
  alert("✅ Settings saved successfully!");
});

// Dummy Logout
function logout() {
  alert("🔒 Logged out successfully!");
  location.reload(); // optional: simulate logout by reloading
}

// Dummy Change Password
function changePassword() {
  alert("🔑 Change password feature is not implemented in this prototype.");
}

// View Asset History
function viewHistory(serial) {
  const historyList = document.getElementById("assetHistory");
  historyList.innerHTML = ""; // Clear existing history
  
  // Find the asset
  const asset = assets.find(a => a.serial === serial);
  if (!asset) return;
  
  // Add asset creation entry
  const creationEntry = document.createElement("div");
  creationEntry.className = "list-group-item";
  creationEntry.innerHTML = `
    <div class="d-flex justify-content-between">
      <h6 class="mb-1">Asset Added</h6>
      <small>${new Date(asset.dateAdded).toLocaleDateString()}</small>
    </div>
    <p class="mb-1">Asset ${asset.type} (${asset.serial}) was added to inventory</p>
  `;
  historyList.appendChild(creationEntry);
  
  // Add assignment history if currently assigned
  const assignment = assignments.find(a => a.asset.serial === serial);
  if (assignment) {
    const assignEntry = document.createElement("div");
    assignEntry.className = "list-group-item";
    assignEntry.innerHTML = `
      <div class="d-flex justify-content-between">
        <h6 class="mb-1">Asset Assigned</h6>
        <small>${new Date(assignment.dateAssigned).toLocaleDateString()}</small>
      </div>
      <p class="mb-1">Assigned to ${assignment.name} (${assignment.id})</p>
    `;
    historyList.appendChild(assignEntry);
  }
}

// Report Issue
function reportIssue(serial) {
  const asset = assets.find(a => a.serial === serial);
  if (!asset) return;
  
  const issue = confirm("Do you want to report this asset as damaged?");
  if (issue) {
    asset.damaged = "Yes";
    updateSummary();
    updateAssignmentTable();
    
    if (userSettings.notifyDamage) {
      alert("📧 Email notification: Asset reported as damaged.");
    }
  }
}

// Export Data
function exportData() {
  const data = {
    assets,
    assignments,
    resignedDevelopers,
    userSettings,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asset_management_export_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import Data
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      assets = data.assets || [];
      assignments = data.assignments || [];
      resignedDevelopers = data.resignedDevelopers || [];
      userSettings = data.userSettings || {};
      
      updateSummary();
      updateAssignmentTable();
      updateResignedTable();
      alert("✅ Data imported successfully!");
    } catch (error) {
      alert("❌ Error importing data: Invalid file format");
    }
  };
  reader.readAsText(file);
}

// Initialize charts
function initializeCharts() {
  // Asset Distribution Chart
  const distributionCtx = document.getElementById("assetDistributionChart").getContext("2d");
  new Chart(distributionCtx, {
    type: "pie",
    data: {
      labels: ["Available", "Assigned", "Damaged"],
      datasets: [{
        data: [
          assets.filter(a => !a.assigned && a.damaged === "No").length,
          assets.filter(a => a.assigned).length,
          assets.filter(a => a.damaged === "Yes").length
        ],
        backgroundColor: ["#10B981", "#3B82F6", "#EF4444"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
  
  // Monthly Usage Trends Chart
  const trendsCtx = document.getElementById("usageTrendsChart").getContext("2d");
  new Chart(trendsCtx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [{
        label: "Assets in Use",
        data: [65, 70, 75, 70, 75, 80],
        borderColor: "#10B981",
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Initialize charts when the page loads
document.addEventListener("DOMContentLoaded", function() {
  try {
    initializeCharts();
    updateSummary();
    updateResignedTable();
  } catch (error) {
    console.error("Error initializing app:", error);
  }
});

function updateResignedTable() {
  try {
    const table = document.getElementById("resignedTable");
    if (!table) return; // Safety check in case table doesn't exist yet
    
    table.innerHTML = "";
    resignedDevelopers.forEach((dev, i) => {
      table.innerHTML += `
        <tr class="text-center">
          <td>${i + 1}</td>
          <td>${dev.name}</td>
          <td>${dev.id}</td>
          <td>${dev.contact || 'N/A'}</td>
          <td>${dev.position || 'N/A'}</td>
          <td>${new Date(dev.lastAsset.dateAdded).toLocaleDateString()}</td>
          <td>${new Date(dev.resignationDate).toLocaleDateString()}</td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error updating resigned table:", error);
  }
}