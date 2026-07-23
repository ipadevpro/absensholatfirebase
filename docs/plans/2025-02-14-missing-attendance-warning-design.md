# Design Spec: Missing Attendance Warning Card & Quick Actions

## Background
Coordinators sometimes forget to fill out attendance for past days. To ensure high data completion, we need to alert them in both the Dashboard and the Attendance page. The warning should act as a helpful reminder, providing quick action buttons to easily click and fill the missing records.

## Requirements
1. **Dashboard Page:**
   - Retain and format the existing missing attendance banner.
2. **Attendance Page:**
   - If the logged-in user is a Coordinator:
     - Check the last 5 school days for missing attendance records.
     - Display an alert card if there are missing records.
     - Provide quick action buttons in the card. Clicking a button will set the page's current `date` and `selectedPrayer` state (or navigate via query params), allowing them to instantly fill the missing attendance record.
