// Simple user data fetching functionality
function enableButton() {
  document.getElementById('fetchBtn').disabled = false;
  document.getElementById('fetchBtn').textContent = 'Get User Data';
  document.getElementById('refreshInboxBtn').disabled = false;
  document.getElementById('userData').innerHTML = 'Ready! Enter a user ID and click the button.';
}

async function fetchUserData() {
  if (!sdkReady) {
    alert("Please wait for the SDK to load...");
    return;
  }

  const userId = document.getElementById('userId').value;
  if (!userId) {
    document.getElementById('userData').innerHTML = '<p>Please enter a user ID</p>';
    return;
  }

  try {
    document.getElementById('userData').innerHTML = '<p>Getting user data from CleverTap API...</p>';
    
    // Step 1: Identify user in SDK (as per ChatGPT's recommendation)
    clevertap.onUserLogin.push({
      "Site": {
        "Identity": userId,
        "Email": userId + "@example.com"
      }
    });
    
    console.log('User identified in SDK, now fetching data from CleverTap API...');
    
    // Step 2: Get user data from our server (which calls CleverTap API)
    const response = await fetch(`/api/user/${userId}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('User data fetched successfully:', data);
      
      // Display the user data
      const div = document.getElementById("userData");
      div.innerHTML = "<h3>User Data:</h3><pre>" + JSON.stringify(data, null, 2) + "</pre>";
      
      // Track successful fetch in SDK
      clevertap.event.push("User Data Fetched", {
        "User ID": userId,
        "Profile Data": data,
        "Timestamp": new Date().toISOString()
      });
      
    } else {
      console.error('API error:', data);
      document.getElementById('userData').innerHTML = `
        <h3>Error:</h3>
        <p><strong>${data.error || 'Failed to get user data'}</strong></p>
        ${data.details ? `<p>Details: ${data.details}</p>` : ''}
      `;
      
      // Track failed fetch in SDK
      clevertap.event.push("User Data Fetch Failed", {
        "User ID": userId,
        "Error": data.error,
        "Timestamp": new Date().toISOString()
      });
    }
    
  } catch (err) {
    console.error("Error:", err);
    document.getElementById('userData').innerHTML = "<p>Error: " + err.message + "</p>";
    
    // Track error in SDK
    clevertap.event.push("User Data Fetch Error", {
      "User ID": userId,
      "Error": err.message,
      "Timestamp": new Date().toISOString()
    });
  }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function() {
  // Add event listener to fetch button
  document.getElementById('fetchBtn').addEventListener('click', fetchUserData);
  
  // Add event listener to inbox button
  document.getElementById('refreshInboxBtn').addEventListener('click', refreshInbox);
  
  // Check if SDK is already loaded
  if (typeof sdkReady !== 'undefined' && sdkReady) {
    enableButton();
  }
});

// Web Inbox functionality
async function refreshInbox() {
  if (!sdkReady) {
    alert("Please wait for the SDK to load...");
    return;
  }
  
  try {
    document.getElementById('inboxContainer').innerHTML = '<p>Loading inbox messages...</p>';
    
    // Get user ID from the input field
    const userId = document.getElementById('userId').value;
    if (!userId) {
      document.getElementById('inboxContainer').innerHTML = '<p>Please enter a user ID first</p>';
      return;
    }
    
    // Use Web Inbox APIs
    const messages = clevertap.getAllInboxMessages();
    const unreadCount = clevertap.getInboxMessageUnreadCount();
    const totalCount = clevertap.getInboxMessageCount();
    
    console.log('Web Inbox messages:', messages);
    console.log('Unread count:', unreadCount);
    console.log('Total count:', totalCount);
    
    // Also try to fetch from our backend API
    try {
      const response = await fetch(`/api/inbox/${userId}`);
      const backendData = await response.json();
      console.log('Backend inbox data:', backendData);
    } catch (backendErr) {
      console.log('Backend API not available, using SDK only:', backendErr.message);
    }
    
    if (messages && messages.length > 0) {
      displayInboxMessages(messages);
    } else {
      document.getElementById('inboxContainer').innerHTML = '<p>No inbox messages found.</p>';
    }
    
    // Track inbox refresh
    clevertap.event.push("Web Inbox Refreshed", {
      "Message Count": messages ? messages.length : 0,
      "Unread Count": unreadCount,
      "Total Count": totalCount,
      "Timestamp": new Date().toISOString()
    });
    
  } catch (err) {
    console.error("Error refreshing inbox:", err);
    document.getElementById('inboxContainer').innerHTML = '<p>Error loading inbox: ' + err.message + '</p>';
  }
}

function displayInboxMessages(messages) {
  const container = document.getElementById('inboxContainer');
  
  let html = '<div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">';
  html += '<h4>Found ' + messages.length + ' Web Inbox messages:</h4>';
  
  messages.forEach((message, index) => {
    html += '<div style="border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 5px;">';
    html += '<h5>Message ' + (index + 1) + '</h5>';
    
    // Display message properties (Web Inbox format)
    html += '<p><strong>Title:</strong> ' + (message.title || message.subject || 'No title') + '</p>';
    html += '<p><strong>Message:</strong> ' + (message.message || message.body || message.content || 'No message') + '</p>';
    html += '<p><strong>Date:</strong> ' + (message.date || message.timestamp || message.created_at || 'No date') + '</p>';
    html += '<p><strong>Read:</strong> ' + (message.isRead || message.read || false ? 'Yes' : 'No') + '</p>';
    
    // Display additional Web Inbox properties
    if (message.msgId) {
      html += '<p><strong>Message ID:</strong> ' + message.msgId + '</p>';
    }
    if (message.wzrk_pivot) {
      html += '<p><strong>Pivot:</strong> ' + message.wzrk_pivot + '</p>';
    }
    
    // Add action buttons using Web Inbox APIs
    if (!(message.isRead || message.read)) {
      html += '<button onclick="markAsReadWebInbox(\'' + (message.msgId || index) + '\')" style="margin-right: 10px;">Mark as Read</button>';
    }
    html += '<button onclick="deleteMessageWebInbox(\'' + (message.msgId || index) + '\')" style="background-color: #ff4444; color: white;">Delete</button>';
    
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Web Inbox functions using proper Web Inbox APIs
function markAsReadWebInbox(messageId) {
  try {
    // Use Web Inbox API to mark message as read
    clevertap.markReadInboxMessage(messageId);
    console.log('Web Inbox message marked as read:', messageId);
    
    // Track notification viewed event
    clevertap.renderNotificationViewed({
      msgId: messageId,
      wzrk_pivot: "wzrk_default"
    });
    
    // Refresh inbox to show updated status
    refreshInbox();
    
    // Track the action
    clevertap.event.push("Web Inbox Message Marked as Read", {
      "Message ID": messageId,
      "Timestamp": new Date().toISOString()
    });
  } catch (err) {
    console.error("Error marking Web Inbox message as read:", err);
    alert("Error marking message as read: " + err.message);
  }
}

function deleteMessageWebInbox(messageId) {
  try {
    // Use Web Inbox API to delete message
    clevertap.deleteInboxMessage(messageId);
    console.log('Web Inbox message deleted:', messageId);
    
    // Refresh inbox to show updated list
    refreshInbox();
    
    // Track the action
    clevertap.event.push("Web Inbox Message Deleted", {
      "Message ID": messageId,
      "Timestamp": new Date().toISOString()
    });
  } catch (err) {
    console.error("Error deleting Web Inbox message:", err);
    alert("Error deleting message: " + err.message);
  }
}

// Legacy functions (keeping for compatibility)
function markAsRead(messageIndex) {
  try {
    const messages = clevertap.getAllInboxMessages();
    if (messages && messages[messageIndex]) {
      clevertap.markReadInboxMessage(messageIndex);
      console.log('Message marked as read:', messageIndex);
      
      // Refresh inbox to show updated status
      refreshInbox();
      
      // Track the action
      clevertap.event.push("Message Marked as Read", {
        "Message Index": messageIndex,
        "Timestamp": new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Error marking message as read:", err);
    alert("Error marking message as read: " + err.message);
  }
}

function deleteMessage(messageIndex) {
  try {
    const messages = clevertap.getAllInboxMessages();
    if (messages && messages[messageIndex]) {
      clevertap.deleteInboxMessage(messageIndex);
      console.log('Message deleted:', messageIndex);
      
      // Refresh inbox to show updated list
      refreshInbox();
      
      // Track the action
      clevertap.event.push("Message Deleted", {
        "Message Index": messageIndex,
        "Timestamp": new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Error deleting message:", err);
    alert("Error deleting message: " + err.message);
  }
}
