/**
 * Created by zied on 27/07/2017.
 */
var socket = io();
$('#currentTasks').addClass('active');

//Funtion that returns current date yyyy-mm-dd
function currentDate() {
    var date = new Date();
    var month = date.getUTCMonth() + 1;
    var day = date.getUTCDate();
    var year = date.getUTCFullYear();
    if(month.length!=2)
        month="0"+month;
    var newdate = year+"-"+month+"-"+day;
    return newdate;
}

// set the model date to the current date
$('#buttonNewTask').click(function () {
    var current = currentDate();
    $('#dateInput').val(current);
});

//set le list group item header date
$('#HeaderDate').val("okoko");

socket.on('currentData',function (result,number) {
    $.each(result, function(i, obj) {
        $('#myUL').append('<li>'+
            '<a class="list-group-item" id="DocumentsItem" type="button">'+'Title : '+obj.Title+ 'Date : '+obj.date+ ', Description : '+obj.description+
            '<div class="pull-right action-buttons">'+
            '<button id="PencilButton" data-toggle="modal" data-target="#myModalHorizontal">' +
            '<span class="glyphicon glyphicon-pencil"></span></button>'+
            '<button class="trash" id="TrashButton">' +
            '<span class="glyphicon glyphicon-trash"></span></button>'+
            '</div>'+
            '</a>'+
            '</li>');
    });
    $('#totalCount').append(number);



});
