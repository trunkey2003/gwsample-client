sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("ns.gwsampleclient.controller.GWSample-Client", {
        onInit: function () {

            this.oRouter = this.getOwnerComponent().getRouter();
        },

        onNavigateToSalesOrders: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("SalesOrderList");
        },

        onSalesOrderPress: function(oEvent) {

            var oBindingContext = oEvent.getSource().getBindingContext();
            var sSalesOrderId = oBindingContext.getProperty("SalesOrderID");

            this.oRouter.navTo("SalesOrderDetail", {
                salesOrderId: sSalesOrderId
            });
        }
    });
});