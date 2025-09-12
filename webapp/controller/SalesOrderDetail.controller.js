sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/f/library",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, Fragment, fioriLibrary, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("ns.gwsampleclient.controller.SalesOrderDetail", {
        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("SalesOrderDetail").attachPatternMatched(this._onObjectMatched, this);

            
            this.map = null;
            this.geocoder = null;
            this.isGoogleMapsLoaded = false;

            
            this._productDetailDialog = null;

            
            this._loadGoogleMapsAPI();
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
                    
                    expand: "ToLineItems,ToLineItems/ToProduct,ToBusinessPartner"
                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oView.setBusy(true);
                    },
                    dataReceived: function (oEvent) {
                        oView.setBusy(false);

                        var oData = oEvent.getParameter("data");
                        console.log("Sales Order Detail Data:", oData);

                        if (oData && oData.ToBusinessPartner) {
                            console.log("Business Partner Data loaded:", oData.ToBusinessPartner);
                        } else {
                            console.warn("Business Partner data not available in expansion");
                        }

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

            var oContext = oElementBinding.getBoundContext();
            if (oContext) {
                var oData = oContext.getObject();
                console.log("Binding changed - Current data:", oData);

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

        
        
        onProductLineItemPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var oBindingContext = oSource.getBindingContext();
            
            if (oBindingContext) {
                var oLineItemData = oBindingContext.getObject();
                var sProductId = oLineItemData.ProductID;
                
                console.log("Product line item selected:", oLineItemData);
                
                if (sProductId) {
                    
                    this._openProductDetailDialog(sProductId);
                } else {
                    MessageBox.error("Product information is not available for this line item.");
                }
            } else {
                MessageBox.error("Unable to retrieve product information.");
            }
        },

        
        _openProductDetailDialog: function (sProductId) {
            var oView = this.getView();
            
            
            if (!this._productDetailDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "ns.gwsampleclient.view.ProductDetail",
                    controller: this
                }).then(function (oDialog) {
                    
                    oView.addDependent(oDialog);
                    this._productDetailDialog = oDialog;
                    
                    
                    this._productDetailDialog.setModel(oView.getModel());
                    
                    
                    this._bindProductDialog(sProductId);
                    this._productDetailDialog.open();
                }.bind(this));
            } else {
                
                this._bindProductDialog(sProductId);
                this._productDetailDialog.open();
            }
        },

        
        _bindProductDialog: function (sProductId) {
            var sPath = "/ProductSet('" + sProductId + "')";
            
            this._productDetailDialog.bindElement({
                path: sPath,
                parameters: {
                    expand: "ToSupplier"
                },
                events: {
                    dataRequested: function () {
                        this._productDetailDialog.setBusy(true);
                    }.bind(this),
                    dataReceived: function (oEvent) {
                        this._productDetailDialog.setBusy(false);
                        var oData = oEvent.getParameter("data");
                        if (oData) {
                            console.log("Product data loaded:", oData);
                            
                            
                            var sTitle = "Product Details - " + (oData.Name || oData.ProductID);
                            this._productDetailDialog.setTitle(sTitle);
                        }
                    }.bind(this),
                    change: function () {
                        var oElementBinding = this._productDetailDialog.getElementBinding();
                        if (!oElementBinding.getBoundContext()) {
                            MessageToast.show("Product data could not be loaded.");
                            this.onCloseProductDialog();
                        }
                    }.bind(this)
                }
            });
        },

        
        onCloseProductDialog: function () {
            if (this._productDetailDialog) {
                this._productDetailDialog.close();
            }
        },

        
        onProductDialogClose: function () {
            
            if (this._productDetailDialog) {
                this._productDetailDialog.unbindElement();
            }
        },

        
        _loadGoogleMapsAPI: function () {
            if (window.google && window.google.maps) {
                this.isGoogleMapsLoaded = true;
                this._initializeGoogleMaps();
                return;
            }

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry&callback=onGoogleMapsLoaded';

            window.onGoogleMapsLoaded = function () {
                this.isGoogleMapsLoaded = true;
                this._initializeGoogleMaps();
                console.log("Google Maps API loaded successfully");
            }.bind(this);

            document.head.appendChild(script);
        },

        _initializeGoogleMaps: function () {
            if (window.google && window.google.maps) {
                this.geocoder = new google.maps.Geocoder();
                console.log("Google Maps Geocoder initialized");
            }
        },

        onShowBusinessPartnerLocation: function () {
            if (!this.isGoogleMapsLoaded) {
                MessageBox.error("Google Maps is not loaded yet. Please try again in a moment.");
                return;
            }

            var oContext = this.getView().getBindingContext();
            if (!oContext) {
                MessageBox.error("No sales order data available.");
                return;
            }

            var oData = oContext.getObject();
            var businessPartner = oData.ToBusinessPartner;

            console.log("Business Partner object:", businessPartner);

            if (businessPartner && businessPartner.__ref) {
                console.log("Got business partner reference:", businessPartner.__ref);
                var bpId = this._extractBusinessPartnerIdFromRef(businessPartner.__ref);
                this._loadBusinessPartnerData(bpId);
                return;
            }

            if (!businessPartner || !businessPartner.Address) {
                var customerId = oData.CustomerID;
                if (customerId) {
                    console.log("Trying to load business partner with Customer ID:", customerId);
                    this._loadBusinessPartnerData(customerId);
                    return;
                }
                MessageBox.error("Business partner address information is not available.");
                return;
            }

            this._processBusinessPartnerLocation(businessPartner);
        },

        _extractBusinessPartnerIdFromRef: function (refString) {
            var match = refString.match(/BusinessPartnerSet\('([^']+)'\)/);
            return match ? match[1] : null;
        },

        _loadBusinessPartnerData: function (businessPartnerId) {
            if (!businessPartnerId) {
                MessageBox.error("Business partner ID not available.");
                return;
            }

            var oModel = this.getView().getModel();
            var sPath = "/BusinessPartnerSet('" + businessPartnerId + "')";

            console.log("Loading business partner data from path:", sPath);

            this.byId("mapContainer").setVisible(true);
            this.byId("mapStatus").setText("Loading business partner data...");

            oModel.read(sPath, {
                success: function (oData) {
                    console.log("Business partner data loaded:", oData);
                    this._processBusinessPartnerLocation(oData);
                }.bind(this),
                error: function (oError) {
                    console.error("Error loading business partner data:", oError);
                    this.byId("mapStatus").setText("Error loading business partner data");
                    MessageBox.error("Failed to load business partner data for mapping.");
                }.bind(this)
            });
        },

        _processBusinessPartnerLocation: function (businessPartner) {
            if (!businessPartner || !businessPartner.Address) {
                MessageBox.error("Business partner address information is not available.");
                return;
            }

            var address = this._buildAddressString(businessPartner.Address);
            console.log("Address to geocode:", address);

            if (!address || address.trim() === "") {
                MessageBox.error("Address information is incomplete for mapping.");
                return;
            }

            this.byId("mapContainer").setVisible(true);
            this.byId("mapStatus").setText("Loading map...");

            this._geocodeAndDisplayLocation(address, businessPartner);
        },

        _buildAddressString: function (addressObj) {
            var addressParts = [];

            if (addressObj.Street) addressParts.push(addressObj.Street);
            if (addressObj.Building) addressParts.push(addressObj.Building);
            if (addressObj.City) addressParts.push(addressObj.City);
            if (addressObj.PostalCode) addressParts.push(addressObj.PostalCode);
            if (addressObj.Country) addressParts.push(addressObj.Country);

            return addressParts.join(", ");
        },

        _geocodeAndDisplayLocation: function (address, businessPartner) {
            if (!this.geocoder) {
                MessageBox.error("Geocoding service is not available.");
                return;
            }

            this.geocoder.geocode({ 'address': address }, function (results, status) {
                if (status === 'OK') {
                    console.log("Geocoding successful:", results[0]);
                    this._displayMap(results[0].geometry.location, businessPartner, address);
                    this.byId("mapStatus").setText("Location found and displayed on map");
                } else {
                    console.error("Geocoding failed:", status);
                    this.byId("mapStatus").setText("Could not find location: " + status);

                    var simplifiedAddress = this._getSimplifiedAddress(businessPartner.Address);
                    if (simplifiedAddress !== address) {
                        MessageToast.show("Trying with simplified address: " + simplifiedAddress);
                        this._geocodeAndDisplayLocation(simplifiedAddress, businessPartner);
                    } else {
                        MessageBox.error("Unable to find location for the given address. Status: " + status);
                    }
                }
            }.bind(this));
        },

        _getSimplifiedAddress: function (addressObj) {
            var simpleParts = [];
            if (addressObj.City) simpleParts.push(addressObj.City);
            if (addressObj.Country) simpleParts.push(addressObj.Country);
            return simpleParts.join(", ");
        },

        _displayMap: function (location, businessPartner, address) {
            var mapElement = document.getElementById('googleMap');
            if (!mapElement) {
                MessageBox.error("Map container not found.");
                return;
            }

            this.map = new google.maps.Map(mapElement, {
                center: location,
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });

            var infoContent = this._createInfoWindowContent(businessPartner, address);

            var marker = new google.maps.Marker({
                position: location,
                map: this.map,
                title: businessPartner.CompanyName || "Business Partner Location",
                animation: google.maps.Animation.DROP
            });

            var infoWindow = new google.maps.InfoWindow({
                content: infoContent
            });

            marker.addListener('click', function () {
                infoWindow.open(this.map, marker);
            }.bind(this));

            infoWindow.open(this.map, marker);

            MessageToast.show("Location displayed on map successfully!");
        },

        _createInfoWindowContent: function (businessPartner, address) {
            var content = '<div style="max-width: 300px;">';
            content += '<h3 style="margin-top: 0;">' + (businessPartner.CompanyName || 'Business Partner') + '</h3>';
            content += '<p><strong>ID:</strong> ' + (businessPartner.BusinessPartnerID || 'N/A') + '</p>';
            content += '<p><strong>Address:</strong> ' + address + '</p>';

            if (businessPartner.PhoneNumber) {
                content += '<p><strong>Phone:</strong> ' + businessPartner.PhoneNumber + '</p>';
            }

            if (businessPartner.EmailAddress) {
                content += '<p><strong>Email:</strong> ' + businessPartner.EmailAddress + '</p>';
            }

            if (businessPartner.WebAddress) {
                content += '<p><strong>Website:</strong> <a href="' + businessPartner.WebAddress + '" target="_blank">' + businessPartner.WebAddress + '</a></p>';
            }

            content += '</div>';
            return content;
        },

        onHideMap: function () {
            this.byId("mapContainer").setVisible(false);
            if (this.map) {
                this.map = null;
            }
            MessageToast.show("Map hidden");
        },

        
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

        
        onDataError: function (oError) {
            console.error("Error loading sales order details:", oError);
            MessageBox.error("Failed to load sales order details. Please try again.");
        },

        
        onExit: function () {
            
            if (this.map) {
                this.map = null;
            }
            if (this.geocoder) {
                this.geocoder = null;
            }

            
            if (this._productDetailDialog) {
                this._productDetailDialog.destroy();
                this._productDetailDialog = null;
            }
        }
    });
});
