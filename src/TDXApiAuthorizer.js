$(function () {
    GetAuthorizationHeader();
    AccessTrain(); 
    AccessMetro(); 
    AccessHSPR(); 
    AccessPark();
});

function GetAuthorizationHeader() {
    const parameter = {
        grant_type:"client_credentials",
        client_id: atob(atob(atob("WWtkc2RXVkhaSGxaV0d0M1QxUkZlRXhYVFhsYVJHZDRUMVJaZWt4VVNYbFpiVlYwVGtSVmVFMTNQVDA9"))),
        client_secret: atob(atob(atob("VG5wb2FrMXRXVFZPVkd0MFRtcFJNMDlETURCYVJHY3lURmRHYWsxdFNYUlBSRmsxV1dwSmVGbFhUVFZOVkVwcw==")))
    };
    let auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
  
    $.ajax({
        type: "POST",
        url: auth_url,
        crossDomain:true,
        dataType:'JSON',                
        data: parameter,
        async: false,       
        success: function(data){            
            $("#accesstoken").text(JSON.stringify(data));                           
        },
        error: function (xhr, textStatus, thrownError) {
            
        }
    });          
}

function GetAPIParsedData(api_url) {
    let accesstokenStr = $("#accesstoken").text();    
    let accesstoken = JSON.parse(accesstokenStr);
    let parseData = "";
    if(accesstoken !=undefined){
        $.ajax({
            type: 'GET',
            url: api_url,             
            headers: {
                "authorization": "Bearer " + accesstoken.access_token,                
              },            
            async: false,
            success: function (Data) {
                parseData = JSON.parse(JSON.stringify(Data));
            },
            error: function (xhr, textStatus, thrownError) {
                console.log('errorStatus:',textStatus);
                console.log('Error:',thrownError);
            }
        });
    }
    return parseData;
}
