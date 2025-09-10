sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
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
        },

        onRegenerateData: function() {
            var that = this;
            
            
            MessageBox.confirm(
                "This will regenerate all data in the system. Are you sure you want to continue?",
                {
                    title: "Regenerate All Data",
                    onClose: function(oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that._callRegenerateFunction();
                        }
                    }
                }
            );
        },

        _callRegenerateFunction: function() {
            var oModel = this.getView().getModel();
            var that = this;
            
            
            this.getView().setBusy(true);
            
            
            oModel.callFunction("/RegenerateAllData", {
                method: "POST",
                urlParameters: {
                    NoOfSalesOrders: 50 
                },
                success: function(oData, response) {
                    that.getView().setBusy(false);
                    
                    
                    var sMessage = oData && oData.String ? oData.String : "Data regenerated successfully!";
                    MessageToast.show(sMessage);
                    
                    
                    that._refreshTableData();
                },
                error: function(oError) {
                    that.getView().setBusy(false);
                    
                    
                    var sErrorMessage = "Error regenerating data";
                    try {
                        var oErrorData = JSON.parse(oError.responseText);
                        if (oErrorData && oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                            sErrorMessage = oErrorData.error.message.value;
                        }
                    } catch (e) {
                        
                    }
                    
                    MessageBox.error(sErrorMessage);
                }
            });
        },

        _refreshTableData: function() {
            
            var oTable = this.byId("salesOrderTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
            }
        }
    });
});
