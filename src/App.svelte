<script>
	import compList from "./companycards.js"
	import taxList from "./taxcards.js"
	import saboList from "./sabocards.js"

	let companyCard
	let taxCard
	let saboCard

	let cardComp
	let cardTax
	let cardSabo


	const pickCompCard = () => {
		let randomCompCard = Math.round(Math.random() * (compList.length - 1))
		cardComp = compList[randomCompCard]
	}

	const pickTaxCard = () => {
		let randomTaxCard = Math.round(Math.random() * (taxList.length - 1))
		cardTax = taxList[randomTaxCard]
	}

	const pickSaboCard = () => {
		let randomSaboCard = Math.round(Math.random() * (saboList.length - 1))
		cardSabo = saboList[randomSaboCard]
	}

	const pushCompCards = () => {
		if (companyCard = true) {
			pickCompCard()
		}
	}

	const pushTaxCards = () => {
		if (taxCard = true) {
			pickTaxCard()
		}
	}

	const pushSaboCards = () => {
		if (saboCard = true) {
			pickSaboCard()
		}
	}

	////// FLIP TRANSITION //////
		function turn(node, {
			delay = 0,
			duration = 600
		}) {
			return {
				delay,
				duration,
				css: (t, u) => `
					transform: rotateY(${(1 - u * 180)}deg);
					backface-visibility: hidden;
				`
			};
	}
	////////////

</script>

<main>
	<div id="logo">
		<img src="./img/logo.png" alt="logo">
		<p>Trykk èn gang for å åpne et kort, trykk èn gang til for å lukke kortet</p>
	</div>

	<div class="container">

		<div class="card company">
			{#if !companyCard}
				<div class="face front" on:click={ () => pushCompCards()} transition:turn>
				</div>
			{:else}
				<div class="face back" on:click={ () => companyCard = false} transition:turn>
					<img src="{cardComp.image}" alt="Bedriftskort">
				</div>
			{/if}
		</div>

		<div class="card tax">
			{#if !taxCard}
				<div class="face front" on:click={ () => pushTaxCards()} transition:turn>
				</div>
			{:else}
				<div class="face back" on:click={ () => taxCard = false} transition:turn>
					<img src="{cardTax.image}" alt="Skattekort">
				</div>
			{/if}
		</div>

		<div class="card sabo">
			{#if !saboCard}
				<div class="face front" on:click={ () => pushSaboCards()} transition:turn>
				</div>
			{:else}
				<div class="face back" on:click={ () => saboCard = false} transition:turn>
					<img src="{cardSabo.image}" alt="Sabotasjekort">
				</div>
			{/if}
		</div>

	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		background-color: #222222;
		color: white;
	}

	main {
		display: grid;
		place-items: center;
		text-align: center;
		margin: 0 auto;
		width: 100%;
		height: 100%;
	}

	#logo {
		position: absolute;
		top: 2rem;
		width: 100%;
		text-align: center;
	}

	#logo img{
		width: 45%;
	}

	#logo p {
		padding-top: 1rem;
	}

	.container {
		display: grid;
		position: relative;
		grid-template-columns: 1fr 1fr 1fr;
		place-items: center;
		width: 55rem;
		height: 44rem;
		padding-top: 2rem;
		/* perspective: 800px; */
	}

	.card {
		width: 14rem;
		height: 21rem;
		cursor: pointer;
		position: relative;
		user-select: none;
		/* transition: transform 1s;
		transform-style: preserve-3d; */
	}

	.card .face {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.card .front {
		background-size: cover;
		z-index: 1;
	}

	.card.company .front{
		background-image: url("../img/bed_front.png");
	}

	.card.tax .front{
		background-image: url("../img/skatt_front.png");
	}

	.card.sabo .front{
		background-image: url("../img/sabo_front.png");
	}

	.card .back img {
		width: 100%;
		height: 100%;
	}


</style>