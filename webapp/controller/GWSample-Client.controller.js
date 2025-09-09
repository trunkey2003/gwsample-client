sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("ns.gwsampleclient.controller.GWSample-Client", {
        onInit: function () {
            // Initialize the view
        },

        onNavigateToSalesOrders: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("SalesOrderList");
        }
    });
});