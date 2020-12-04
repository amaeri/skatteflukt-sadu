<script>
	import companyCards from "./companycards.js"
	import taxCards from "./taxcards.js"
	import saboCards from "./sabocards.js"

	let companyCard = false
	let taxCard = false
	let saboCard = false

	const getTaxCards = () => {
		let openTaxCards = Math.round(Math.random() * (taxCards.length - 1))
		let taxcard = taxCards[openTaxCards]
	}

	const pushTaxCards = () => {
		if(taxCard = true)
			getTaxCards()
	}

</script>

<main>
	<div class="container">

		<!-- <div class="kort">
			{#if !companyCard}
				<div id="company_closed" class="card_closed" on:click={ () => companyCard = true}>
				</div>
			{:else}
				<div class="card_open" on:click={ () => companyCard = false}>
				</div>
			{/if}
		</div> -->

		<div class="taxcard">
			{#if !taxCard}
				<div class="closed size" on:click={ () => pushTaxCards()}>
				</div>
			{:else}
				<div class="open size" on:click={ () => taxCard = false}>
						<img src="{taxCards.image}" alt="{taxCards.title}">
				</div>
			{/if}
		</div>

		<!-- <div class="kort" id="sabotasjekort">
			{#if !saboCard}
				<div id="sabo_closed" class="card_closed" on:click={ () => saboCard = true}>
				</div>
			{:else}
				<div class="card_open" on:click={ () => saboCard = false}>
				</div>
			{/if}
		</div> -->

	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	main {
		display: grid;
		place-items: center;
		text-align: center;
		margin: 0 auto;
	}

	.container {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		place-items: center;
		width: 900px;
		height: 700px;
	}

	.taxcard {
		padding: 1rem;
		border-radius: 10px;
		width: 200px;
		height: 300px;
	}

	/* .tax-card .open .closed {
		width: 100%;
		height: 100%;
		background-size: contain;
	} */

	.size {
		width: 100%;
		height: 100%;
		background-size: contain;
	}

	.size img {
		width: 100%;
		height: 100%;
		background-size: contain;
	}

	.taxcard .closed {
		background-image: url("../img/skatt_front.png");
	}

</style>