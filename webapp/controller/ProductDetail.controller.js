sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, Fragment, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("ns.gwsampleclient.controller.ProductDetail", {
        
        onInit: function () {
            
            this._dialog = null;
        },

        
        openDialog: function (oProductContext, oParentView) {
            var oView = oParentView;
            var oModel = oView.getModel();

            
            if (!this._dialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "ns.gwsampleclient.view.ProductDetail",
                    controller: this
                }).then(function (oDialog) {
                    
                    oView.addDependent(oDialog);
                    this._dialog = oDialog;
                    
                    
                    this._dialog.setModel(oModel);
                    this._bindDialog(oProductContext);
                    this._dialog.open();
                }.bind(this));
            } else {
                this._bindDialog(oProductContext);
                this._dialog.open();
            }
        },

        
        _bindDialog: function (oProductContext) {
            if (oProductContext) {
                var sPath = oProductContext.getPath();
                
                
                this._dialog.bindElement({
                    path: sPath,
                    parameters: {
                        expand: "ToSupplier"
                    },
                    events: {
                        dataRequested: function () {
                            this._dialog.setBusy(true);
                        }.bind(this),
                        dataReceived: function (oEvent) {
                            this._dialog.setBusy(false);
                            var oData = oEvent.getParameter("data");
                            if (oData) {
                                console.log("Product data loaded:", oData);
                                
                                
                                var sTitle = "Product Details - " + (oData.Name || oData.ProductID);
                                this._dialog.setTitle(sTitle);
                            }
                        }.bind(this),
                        change: function () {
                            
                            var oElementBinding = this._dialog.getElementBinding();
                            if (!oElementBinding.getBoundContext()) {
                                MessageToast.show("Product data could not be loaded.");
                                this.onCloseDialog();
                            }
                        }.bind(this)
                    }
                });
            }
        },

        
        openDialogByProductId: function (sProductId, oParentView) {
            if (!sProductId) {
                MessageBox.error("Product ID is required to display product details.");
                return;
            }

            var oView = oParentView;
            var oModel = oView.getModel();
            var sPath = "/ProductSet('" + sProductId + "')";

            
            if (!this._dialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "ns.gwsampleclient.view.ProductDetail",
                    controller: this
                }).then(function (oDialog) {
                    
                    oView.addDependent(oDialog);
                    this._dialog = oDialog;
                    
                    
                    this._dialog.setModel(oModel);
                    this._bindDialogByPath(sPath);
                    this._dialog.open();
                }.bind(this));
            } else {
                this._bindDialogByPath(sPath);
                this._dialog.open();
            }
        },

        
        _bindDialogByPath: function (sPath) {
            this._dialog.bindElement({
                path: sPath,
                parameters: {
                    expand: "ToSupplier"
                },
                events: {
                    dataRequested: function () {
                        this._dialog.setBusy(true);
                    }.bind(this),
                    dataReceived: function (oEvent) {
                        this._dialog.setBusy(false);
                        var oData = oEvent.getParameter("data");
                        if (oData) {
                            console.log("Product data loaded:", oData);
                            
                            
                            var sTitle = "Product Details - " + (oData.Name || oData.ProductID);
                            this._dialog.setTitle(sTitle);
                        }
                    }.bind(this),
                    change: function () {
                        var oElementBinding = this._dialog.getElementBinding();
                        if (!oElementBinding.getBoundContext()) {
                            MessageToast.show("Product data could not be loaded.");
                            this.onCloseDialog();
                        }
                    }.bind(this)
                }
            });
        },

        
        onCloseDialog: function () {
            if (this._dialog) {
                this._dialog.close();
            }
        },

        
        onDialogClose: function () {
            
            if (this._dialog) {
                this._dialog.unbindElement();
            }
        },

        
        onExit: function () {
            if (this._dialog) {
                this._dialog.destroy();
            }
        },

        
        formatCurrency: function (sValue, sCurrency) {
            if (!sValue || !sCurrency) {
                return "";
            }
            return sValue + " " + sCurrency;
        },

        
        formatDimension: function (sValue, sUnit) {
            if (!sValue || !sUnit) {
                return "";
            }
            return sValue + " " + sUnit;
        },

        
        formatWeight: function (sValue, sUnit) {
            if (!sValue || !sUnit) {
                return "";
            }
            return sValue + " " + sUnit;
        }
    });
});
