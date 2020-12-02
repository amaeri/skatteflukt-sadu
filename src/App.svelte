<script>
	import companyCards from "./companycards.js"
	import taxCards from "./taxcards.js"
	import saboCards from "./sabocards.js"

	let companyCard = false
	let taxCard = false
	let saboCard = false

	let openCompanyCards
	const getCompanyCards = () => {
		openCompanyCards = companyCards.results
	}
	getCompanyCards()

</script>

<main>
	<div class="container">

		<div class="kort" id="bedriftskort">
			{#if !companyCard}
				<div class="card_closed" on:click={ () => companyCard = true}>
					<p>Bedriftskort</p>
				</div>
			{:else}
				<div class="card_open" on:click={ () => companyCard = false}>
					{#each openCompanyCards as openCompanyCard}
						<img src="{openCompanyCard.icon}" alt="{openCompanyCard.company}">
						<p>{openCompanyCard.text}</p>
					{/each}
				</div>
			{/if}
		</div>

		<div class="kort" id="skattekort">
			{#if !taxCard}
				<div class="card_closed" on:click={ () => taxCard = true}>
					<p>Skattekort</p>
				</div>
			{:else}
				<div class="card_open" on:click={ () => taxCard = false}>
					<p>Banan AS har sluttet å skatte i landet ditt. Du mister fremtidige månedlige skatteinntekter</p>
				</div>
			{/if}
		</div>

		<div class="kort" id="sabotasjekort">
			{#if !saboCard}
				<div class="card_closed" on:click={ () => saboCard = true}>
					<p>Sabotasjekort</p>
				</div>
			{:else}
				<div class="card_open" on:click={ () => saboCard = false}>
					<p>Du kan sabotere en medspiller ved å stjele 500 i skatt</p>
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
		background-color: lightgrey;
		width: 900px;
		height: 700px;
	}

	.kort {
		padding: 1rem;
		border-radius: 10px;
		width: 200px;
		height: 300px;
	}

	.card_open,
	.card_closed {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}

	.card_closed {
		font-weight: 700;
	}
	#bedriftskort {
		background: #FEF445;
	}

	#skattekort {
		background: #CEE741;
	}

	#sabotasjekort {
		background: #F24726;
	}
</style>