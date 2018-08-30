/**
 * Created by zied on 23/07/2017.
 */
var socket = io();
$('#allTasks').addClass('active');
//Inserting the list into the database
$('#SaveChangesButton').click(function () {
    var title = $('#titleInput').val();
    var date = $('#dateInput').val();
    var description = $('#descriptionInput').val();

    socket.emit('save',title,date,description);

    $('#titleInput').val('');
    $('#dateInput').val('');
    $('#descriptionInput').val('');

    $('#myModalHorizontal').modal('hide');

})

//Pencil Button
$('#PencilButton').click(function () {
    var text = $('#DocumentsItem').text();
    var Title = text.substring(text.indexOf(":")+2,text.indexOf(","));
    //var date =
    var description = text.substring(text.lastIndexOf(":")+2,text.lastIndexOf(","));
    $('#titleInput2').val(Title);
    $('#descriptionInput2').val(description);
    $('#SaveChangesButton2').click(function () {
        var titre=$('#titleInput2').val(Title);
        var desc=$('#descriptionInput2').val(description);
        socket.emit('update',title,description,titre,desc);
    })

});

//delete Button
$('#TrashButton').click(function () {
    var text = $('#DocumentsItem').text();
    alert(text);
});
socket.on('data',function (result,number) {
    $.each(result, function(i, obj) {
        $('#myUL').append('<li>'+
                                '<a class="list-group-item" id="DocumentsItem" type="button">'+'Title : '+obj.Title+ ', Date : '+obj.date+ ', Description : '+obj.description+
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
