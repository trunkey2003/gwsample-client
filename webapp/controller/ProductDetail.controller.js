/**
 * @fileoverview Product detail controller that manages product detail dialog
 * with comprehensive product information display and navigation.
 * @namespace ns.gwsampleclient.controller
 * @author SAP
 * @version 1.0.0
 */

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], 
/**
 * Creates the ProductDetail controller class
 * @param {sap.ui.core.mvc.Controller} Controller - Base controller class
 * @param {sap.ui.core.Fragment} Fragment - Fragment loader for dialogs
 * @param {sap.m.MessageBox} MessageBox - Message box for error dialogs
 * @param {sap.m.MessageToast} MessageToast - Message toast for notifications
 * @returns {ns.gwsampleclient.controller.ProductDetail} ProductDetail controller class
 */
function (Controller, Fragment, MessageBox, MessageToast) {
    "use strict";

    /**
     * Product detail controller for managing product information dialogs
     * @class ns.gwsampleclient.controller.ProductDetail
     * @extends sap.ui.core.mvc.Controller
     */
    return Controller.extend("ns.gwsampleclient.controller.ProductDetail", {
        
        /**
         * Initializes the controller and sets up initial properties
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @public
         * @override
         */
        onInit: function () {
            /**
             * Product detail dialog instance
             * @type {sap.m.Dialog|null}
             * @private
             */
            this._dialog = null;
        },

        /**
         * Opens product detail dialog with product context binding
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @param {sap.ui.model.Context} oProductContext - Product binding context
         * @param {sap.ui.core.mvc.View} oParentView - Parent view that owns the dialog
         * @public
         */
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

        /**
         * Binds the dialog to product context with expanded supplier information
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @param {sap.ui.model.Context} oProductContext - Product binding context
         * @private
         */
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

        /**
         * Opens product detail dialog by product ID
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @param {string} sProductId - Product ID to display
         * @param {sap.ui.core.mvc.View} oParentView - Parent view that owns the dialog
         * @public
         */
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

        /**
         * Binds the dialog to product by entity path
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @param {string} sPath - OData entity path for product
         * @private
         */
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

        /**
         * Closes the product detail dialog
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @public
         */
        onCloseDialog: function () {
            if (this._dialog) {
                this._dialog.close();
            }
        },

        /**
         * Handles dialog close event and unbinds element
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @public
         */
        onDialogClose: function () {
            if (this._dialog) {
                this._dialog.unbindElement();
            }
        },

        /**
         * Cleanup when controller is destroyed
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @public
         * @override
         */
        onExit: function () {
            if (this._dialog) {
                this._dialog.destroy();
            }
        },

        /**
         * Formats currency value with currency code
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @param {string} sValue - Currency value
         * @param {string} sCurrency - Currency code
         * @returns {string} Formatted currency string or empty string
         * @public
         */
        formatCurrency: function (sValue, sCurrency) {
            if (!sValue || !sCurrency) {
                return "";
            }
            return sValue + " " + sCurrency;
        },

        /**
         * Formats dimension value with unit
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @param {string} sValue - Dimension value
         * @param {string} sUnit - Unit of measure
         * @returns {string} Formatted dimension string or empty string
         * @public
         */
        formatDimension: function (sValue, sUnit) {
            if (!sValue || !sUnit) {
                return "";
            }
            return sValue + " " + sUnit;
        },

        /**
         * Formats weight value with unit
         * @memberof ns.gwsampleclient.controller.ProductDetail
         * @param {string} sValue - Weight value
         * @param {string} sUnit - Weight unit
         * @returns {string} Formatted weight string or empty string
         * @public
         */
        formatWeight: function (sValue, sUnit) {
            if (!sValue || !sUnit) {
                return "";
            }
            return sValue + " " + sUnit;
        }
    });
});