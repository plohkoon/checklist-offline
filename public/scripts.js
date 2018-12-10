
$(function() {

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

    $("#date").change(function() {

        $("#date-selector").submit();

    })

    $(".content-row-clickable").click(function() {

        if($(this).parent().hasClass("active")) {

            $(this).parent().removeClass("active");

        }
        else {

            $(this).parent().addClass("active");

        }

    })

});
