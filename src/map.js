var map = function(){
    "use strict";

    var map;
    var markers = [];
    var infoWindow;
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;
    var addressInput = 'addressInput';
    var autoPlaceHolder = 'Identificando sua localização, aguarde um momento.';
    var defaultPlaceholder = 'Entre com sua cidade, CEP ou endereço (Ex.: Rua Treze de Maio, 123, Campinas)';

    var getMarkers = function(center) {
        if (!center.hasOwnProperty('lat')) center.lat = 0;
        if (!center.hasOwnProperty('lng')) center.lng = 0;
        if (!center.hasOwnProperty('dst')) center.dst = 10; // default radius = 25 miles
        // Returns the argument deg converted from degrees to radians
        var radians = function(deg) {
            return deg * (Math.PI/180);
        };
        //
        return new jinqJs()
            .from(locations)
            .where(function(row){
                row.distance = (3959 * Math.acos(Math.cos(radians(center.lat)) *
                    Math.cos(radians(row.lat)) * Math.cos(radians(row.lng) - radians(center.lng)) +
                    Math.sin(radians(center.lat)) * Math.sin(radians(row.lat)))).toFixed(2);
                return row.distance < center.dst;
            })
            .orderBy([{field:'distance', sort:'asc'}])
            //.top(20)
            .select();
    };

    function load() {
        map = new google.maps.Map(document.getElementById("map"), {
            center: new google.maps.LatLng(-23.546086,-46.6662639),
            zoom: 10,
            mapTypeId: 'roadmap'
        });
        infoWindow = new google.maps.InfoWindow();
        detectCurrentPositionAndSearchLocationsNear();
    }

    function detectCurrentPositionAndSearchLocationsNear() {
        var addressInputObj = document.getElementById(addressInput);
        var placeHolderLoadingCounter = 0;
        if (navigator.geolocation) {
            addressInputObj.placeholder = autoPlaceHolder;
            var placeHolderTimer = window.setInterval(function(){
                addressInputObj.placeholder = autoPlaceHolder + Array(1 + placeHolderLoadingCounter++ % 3).join('.');
                if (placeHolderLoadingCounter > 15) {
                    window.clearInterval(placeHolderTimer);
                    addressInputObj.placeholder = defaultPlaceholder;
                }
            }, 500);
            var geocoder = new google.maps.Geocoder();
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                var latlng = new google.maps.LatLng(lat, lng);
                geocoder.geocode({'latLng': latlng}, function(results, status) {
                    window.clearInterval(placeHolderTimer);
                    addressInputObj.placeholder = defaultPlaceholder;
                    if (addressInputObj.value === '') {
                        if(status == google.maps.GeocoderStatus.OK) {
                            addressInputObj.value = results[0].formatted_address;
                            searchLocationsNear(latlng);
                        }
                    }
                });
            }, function (error) {
                window.clearInterval(placeHolderTimer);
                addressInputObj.placeholder = defaultPlaceholder;
            });
        } else {
            addressInputObj.placeholder = defaultPlaceholder;
        }
    }

    function searchLocations() {
        var address = document.getElementById(addressInput).value;
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({address: address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                searchLocationsNear(results[0].geometry.location);
                /*
                 var marker = new google.maps.Marker({
                 map: map,
                 position: new google.maps.LatLng(
                 parseFloat(results[0].geometry.location.lat()),
                 parseFloat(results[0].geometry.location.lng())),
                 icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                 });
                 markers.push(marker);
                 */
            } else if (address!=='') {
                alert('Desculpe, não conhecemos ' + address);
            }
        });
    }

    function clearLocations() {
        infoWindow.close();
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers.length = 0;
    }

    function searchLocationsNear(center) {
        clearLocations();

        var address = document.getElementById(addressInput).value;
        var markerNodes = getMarkers({lat: center.lat(), lng: center.lng()});

        if (!markerNodes.length) {
            if (address!=='')
                alert('Nenhuma revenda encontrada em ' + address);
            return;
        }

        var bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < markerNodes.length; i++) {
            var latlng = new google.maps.LatLng(parseFloat(markerNodes[i].lat), parseFloat(markerNodes[i].lng));
            createMarker(latlng, markerNodes[i]);
            bounds.extend(latlng);
        }

        map.fitBounds(bounds);
    }

    function createMarker(latlng, node) {
        var html = "<b>" + node.nome + " " + node.telefone + "</b><br>&nbsp;<br>" +
            node.endereco + ", " + node.bairro + "<br>" +
            (node.complemento !== '' ? node.complemento + "<br>" : '') +
            node.cidade + "/" + node.estado + "<br>" +
            node.cep + "<br>&nbsp;<br>" +
            'Aprox. ' + (parseFloat(node.distance) * 1.6).toFixed(2) + 'km de distância. ' +
            '<a target="_blank" href="https://www.google.com.br/maps/dir//'+latlng.toUrlValue()+'">Traçar&nbsp;rota</a>';
        var marker = new google.maps.Marker({
            map: map,
            position: latlng,
            label: labels[labelIndex++ % labels.length],
        });
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.setContent(html);
            infoWindow.open(map, marker);
        });
        markers.push(marker);
    }

    load();

    return {
        search: function() { searchLocations(); }
    };
}();