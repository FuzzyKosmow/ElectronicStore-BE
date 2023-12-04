const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const InventoryItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
});
const InventorySchema = new Schema({
    items: [InventoryItemSchema]
});
InventorySchema.methods.addItemQuantity = function (productId, quantity = 1) {
    const inventoryItem = this.items.find(item => item.productId.equals(productId));
    if (inventoryItem) {
        inventoryItem.quantity += quantity;
    } else {
        this.items.push({ productId, quantity });
    }
    return this.save();
}
InventorySchema.methods.removeItemQuantity = function (productId, quantity = 1) {
    const inventoryItem = this.items.find(item => item.productId.equals(productId));
    if (inventoryItem) {
        inventoryItem.quantity -= quantity;
        if (inventoryItem.quantity < 0) {
            inventoryItem.quantity = 0;
        }
    }
    return this.save();
}

module.exports = mongoose.model('Inventory', InventorySchema);