
$(() => {
    //a function to open up the edit field when its respective button is pressed
    $(".update-button").click(function() {

        if( $(this).closest("tr").next().hasClass("active") ) {

            $(this).html("Close")

            $(this).closest("tr").next().removeClass("active");

        }
        else {

            $(this).html("Edit")

            $(this).closest("tr").next().addClass("active");

            $(this).closest("tr").next().find("form").trigger('reset');

        }

    })
    //opens and closes the top entry field and rotates the arrow
    $("#arrow").click(() => {

        if($("#topBar").css("margin-top") !== "0px") {

            $("#topBar").animate({"margin-top": "0"}, "slow");

            $("#arrow").addClass("active");

        }
        else {

            let height = $("#topBar").height();
            //calculates how much to hide by based on the height of the topbar element
            $("#topBar").animate({"margin-top": "-" + height + "px"}, "slow");

            $("#arrow").removeClass("active");

        }

    })
    //when the date field changes auto submit the form
    $("#date").change(() => {

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
        /*
        if the edit field is open (its closed when it has class active) ensures
        that it closes properly to prevent weird table formatting
        */
        if( !$(this).closest("tr").next().hasClass("active") ) {

            $(this).next(".end").find(".update-button").html("Edit");

            $(this).closest("tr").next().addClass("active");

            $(this).closest("tr").next().find("form").trigger('reset');

        }

    })

});
