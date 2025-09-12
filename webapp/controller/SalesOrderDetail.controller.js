sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/f/library"
], function (Controller, fioriLibrary) {
    "use strict";

    return Controller.extend("ns.gwsampleclient.controller.SalesOrderDetail", {
        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("SalesOrderDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sSalesOrderId = oEvent.getParameter("arguments").salesOrderId;
            var sObjectPath = this.getModel().createKey("SalesOrderSet", {
                SalesOrderID: sSalesOrderId
            });

            this._bindView("/" + sObjectPath);
        },

        _bindView: function (sObjectPath) {
            var oView = this.getView();

            oView.bindElement({
                path: sObjectPath,
                parameters: {
                    // Expand to include line items with product details and business partner details
                    expand: "ToLineItems,ToLineItems/ToProduct,ToBusinessPartner"
                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oView.setBusy(true);
                    },
                    dataReceived: function (oEvent) {
                        oView.setBusy(false);
                        
                        // Log the received data for debugging
                        var oData = oEvent.getParameter("data");
                        console.log("Sales Order Detail Data:", oData);
                        
                        // Check if business partner data is available
                        if (oData && oData.ToBusinessPartner) {
                            console.log("Business Partner Data loaded:", oData.ToBusinessPartner);
                        } else {
                            console.warn("Business Partner data not available in expansion");
                        }
                        
                        // Check if line items are available
                        if (oData && oData.ToLineItems && oData.ToLineItems.results) {
                            console.log("Line Items loaded:", oData.ToLineItems.results.length);
                        }
                    }
                }
            });
        },

        _onBindingChange: function () {
            var oView = this.getView();
            var oElementBinding = oView.getElementBinding();

            if (!oElementBinding.getBoundContext()) {
                this.oRouter.getTargets().display("notFound");
                return;
            }

            // Additional logic to handle binding change if needed
            var oContext = oElementBinding.getBoundContext();
            if (oContext) {
                var oData = oContext.getObject();
                console.log("Binding changed - Current data:", oData);
                
                // Update page title with sales order ID
                var sTitle = "Sales Order Details - " + (oData.SalesOrderID || "");
                oView.byId("detailPage").setTitle(sTitle);
            }
        },

        onNavBack: function () {
            this.oRouter.navTo("RouteGWSample-Client");
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        // Additional helper methods for formatting if needed
        formatCurrency: function (sValue, sCurrency) {
            if (!sValue || !sCurrency) {
                return "";
            }
            return sValue + " " + sCurrency;
        },

        formatDate: function (oDate) {
            if (!oDate) {
                return "";
            }
            return sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            }).format(oDate);
        },

        // Method to handle any errors in data loading
        onDataError: function (oError) {
            console.error("Error loading sales order details:", oError);
            sap.m.MessageBox.error("Failed to load sales order details. Please try again.");
        }
    });
});