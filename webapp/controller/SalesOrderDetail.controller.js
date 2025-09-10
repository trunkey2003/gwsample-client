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
                    expand: "ToLineItems,ToLineItems/ToProduct"
                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oView.setBusy(true);
                    },
                    dataReceived: function () {
                        oView.setBusy(false);
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
        },

        onNavBack: function () {
            this.oRouter.navTo("RouteGWSample-Client");
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        }
    });
});