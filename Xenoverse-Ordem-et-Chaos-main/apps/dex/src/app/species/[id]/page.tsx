import {
  getSpeciesById,
  getEvolutions,
  getLearnset,
  getSpeciesEncounters,
  getAdjacentSpecies,
  getSpeciesForms,
} from '@/lib/db';
import SpeciesDetailView from '@/components/SpeciesDetailView';
import { notFound } from 'next/navigation';
import { getDefensiveEffectiveness } from '@/lib/typeUtils';
import { Metadata, ResolvingMetadata } from 'next';

interface Props {
  params: { id: string };
  searchParams: { form?: string; view?: string };
}

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const speciesId = params.id;
  const formParam = searchParams.form;
  const formId = formParam ? parseInt(formParam as string) : 0;

  const species = getSpeciesById(speciesId, formId);

  if (!species) {
    return {
      title: 'Species Not Found | Xenoverse Dex',
    };
  }

  const formName = species.form_name || (species.form_id > 0 ? `Form ${species.form_id}` : '');
  const titleName = formName && species.form_id > 0 ? `${species.name} (${formName})` : species.name;

  return {
    title: `${titleName} | Xenoverse Dex`,
    description: `View stats, moves, evolutions, and locations for ${titleName} in Pokémon Xenoverse. Type: ${species.type1}${species.type2 ? '/' + species.type2 : ''}. Base Stats: ${species.bst}.`,
  };
}

export default async function SpeciesPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const speciesId = params.id;
  const formParam = searchParams.form;
  const formId = formParam ? parseInt(formParam) : 0;

  const species = getSpeciesById(speciesId, formId);

  if (!species) {
    notFound();
  }

  // Parallel fetch
  const [evolutions, learnsetData, encounters, adjacent] = await Promise.all([
    getEvolutions(species.id, species.form_id),
    getLearnset(species.id, species.form_id),
    getSpeciesEncounters(species.id),
    getAdjacentSpecies(species.id, species.form_id),
  ]);

  const forms = getSpeciesForms(species.id);
  const typeEffectiveness = getDefensiveEffectiveness(species.type1, species.type2);

  return (
    <div className="pb-20">
      <SpeciesDetailView
        species={species}
        evolutions={evolutions}
        learnset={learnsetData.entries}
        learnsetSource={learnsetData.source}
        adjacent={adjacent}
        typeEffectiveness={typeEffectiveness}
        forms={forms}
        encounters={encounters}
        initialView={searchParams.view}
        initialForm={searchParams.form}
      />
    </div>
  );
}
