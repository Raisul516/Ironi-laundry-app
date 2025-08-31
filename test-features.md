# Feature Testing Guide

## New Features Implemented

### 1. Order History & Repeat Order ✅

- **Order History**: Users can view all their past orders with complete details
- **Repeat Order**: Users can repeat any past order with a single click
- **Cancel Order**: Users can cancel pending orders
- **Order Details**: Each order shows date, time, services, items, total cost, and status

### 2. Online Payment Gateway ✅

- **Payment Methods**: Card, Wallet, Cash on Delivery (COD)
- **Payment Flow**: Initiate payment → Confirm payment → Update order status
- **Payment Status**: Shows payment method and status for each order

### 3. Notifications System ✅

- **Notification Types**: Pickup reminders, status updates, delivery alerts, payment notifications
- **Notification Panel**: Bell icon with unread count badge
- **Actions**: Mark as read, mark all as read, delete notifications

### 4. Laundry Instructions ✅

- **Special Instructions**: Text area for custom instructions during order creation
- **Edit Instructions**: Update instructions for pending orders
- **Validation**: Cannot edit instructions after order processing starts

## Backend API Endpoints

### Orders

- `GET /api/orders` - Get user's orders (order history)
- `GET /api/orders/history` - Alias for order history
- `POST /api/orders/repeat/:orderId` - Repeat an order
- `PUT /api/orders/:orderId/cancel` - Cancel an order
- `POST /api/orders/:orderId/pay` - Initiate payment
- `PUT /api/orders/:orderId/pay` - Confirm payment
- `PUT /api/orders/:orderId/instructions` - Update order instructions

### Notifications

- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/unread-count` - Get unread notification count
- `POST /api/notifications` - Create notification (system/admin use)
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:notificationId` - Delete notification

## Database Schema Updates

### Order Model

- Added `instructions` field for special instructions
- Added `payment` object with method, status, transactionId, paidAt
- Added `updatedAt` field for tracking changes

### Notification Model (New)

- `userId` - Reference to user
- `message` - Notification message
- `type` - Notification type (pickup_reminder, status_update, delivery_alert, payment, general)
- `isRead` - Read status
- `orderId` - Optional reference to related order
- `createdAt` - Timestamp

## Frontend Components

### New Components

1. **NotificationPanel** - Modal for displaying and managing notifications
2. **PaymentModal** - Modal for payment processing

### Updated Components

1. **Dashboard** - Added all new features and UI elements

## Testing Steps

### 1. Order Creation with Instructions

1. Create a new order
2. Add special instructions in the text area
3. Verify instructions are saved and displayed

### 2. Payment Processing

1. Create an order
2. Click "Pay Now" button
3. Select payment method (COD/Card/Wallet)
4. Complete payment flow
5. Verify payment status updates

### 3. Repeat Order

1. View order history
2. Click "Repeat Order" on any past order
3. Verify new order is created with same items/services
4. Check pickup time is set to tomorrow 10 AM

### 4. Cancel Order

1. Create a pending order
2. Click "Cancel Order" button
3. Confirm cancellation in the popup
4. Verify order status changes to "Cancelled"
5. Check that notification is generated

### 5. Notifications

1. Create an order (should generate notification)
2. Click bell icon to open notifications
3. Test mark as read functionality
4. Test delete notification functionality

### 6. Edit Instructions

1. Create a pending order
2. Click "Edit Instructions" button
3. Update instructions
4. Verify changes are saved

## Expected Behaviors

### Order Status Flow

- Pending → Confirmed (after payment) → Washing → Delivered
- Pending → Cancelled (user cancels order)

### Payment Status Flow

- Pending → Paid (after successful payment)

### Notification Generation

- Order creation
- Payment initiation
- Payment confirmation
- Order status changes
- Order cancellation

### Validation Rules

- Cannot edit instructions for non-pending orders
- Cannot initiate payment for already paid orders
- Cannot initiate payment for non-pending orders
- Cannot cancel non-pending orders
