
$(function() {
    //a function to open up the edit field when its respective button is pressed
    $(".update-button").click(function() {

        if( $(this).text() === "Edit") {

            $(this).html("Close")

            $(this).closest("tr").next().removeClass("active");

        }
        else {

            $(this).html("Edit")

            $(this).closest("tr").next().addClass("active");

        }

    })
    //opens and closes the top entry field and rotates the arrow
    $("#arrow").click(function() {

        if($("#topBar").css("margin-top") !== "0px") {

            $("#topBar").animate({"margin-top": "0"}, "slow");

            $("#arrow").addClass("active");

        }
        else {

            $("#topBar").animate({"margin-top": "-" + $("#topBar").css("height")}, "slow");

            $("#arrow").removeClass("active");

        }

    })
    //when the date field changes auto submit the form
    $("#date").change(function() {

        $("#date-selector").submit();

    })
    //when the row is clicked toggles a minimize to just the header centered on the row
    $(".content-row-clickable").click(function() {

        if($(this).parent().hasClass("active")) {

            $(this).parent().removeClass("active");

        }
        else {

            $(this).parent().addClass("active");

        }

    })

});
