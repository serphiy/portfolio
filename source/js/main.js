$(document).ready(function(){
    $('.technologies__carousel').slick({
        arrows: true,
        dots: false,
        infinite: true,
        speed: 300,
        slidesToShow: 5,
        slidesToScroll: 1,
        variableWidth: true,
        centerMode: true,
        centerPadding: '20px',
    });
});