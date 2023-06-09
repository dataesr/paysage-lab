import { useOutletContext } from 'react-router-dom';
import { Col, Row, Title } from '@dataesr/react-dsfr';

import Emails from '../../../components/blocs/emails';
import HistoriqueEtDates from '../../../components/blocs/historique-et-dates';
import Identifiers from '../../../components/blocs/identifiers';
import Localisations from '../../../components/blocs/localisations';
import Names from '../../../components/blocs/names';
import SocialMedias from '../../../components/blocs/social-medias';
import Weblinks from '../../../components/blocs/weblinks';
import { INTERNAL_PAGES_TYPES, WEBLINKS_TYPES } from '../../../components/blocs/weblinks/constants';
import Wiki from '../../../components/blocs/wiki';
import KeyValueCard from '../../../components/card/key-value-card';
import useEditMode from '../../../hooks/useEditMode';
import { RelationsByTag, RelationsGouvernance } from '../../../components/blocs/relations';
import MandateForm from '../../../components/forms/mandate';
import { STRUCTURE_CATEGORIE, GOUVERNANCE } from '../../../utils/relations-tags';

export default function StructurePresentationPage() {
  const data = useOutletContext();
  const { editMode } = useEditMode();
  if (!data) return null;
  const { descriptionEn, descriptionFr } = data;
  return (
    <>
      <Row>
        <Col n="12">
          <Title as="h3" look="h4">En un coup d'oeil</Title>
        </Col>
      </Row>
      <Names visible={editMode} />
      <Row gutters className="flex--wrap-reverse">
        <Col n="12 xl-6">
          <HistoriqueEtDates />
        </Col>
        <Col n="12 xl-6">
          <Localisations />
        </Col>
      </Row>
      <Row gutters spacing="mb-5w">
        <Col n="12">
          <KeyValueCard
            titleAsText
            className="card-structures"
            cardKey="Description"
            cardValue={descriptionFr || descriptionEn}
            icon="ri-align-left"
          />
        </Col>
        <Col n="12"><Wiki /></Col>
      </Row>
      <RelationsGouvernance
        tag={GOUVERNANCE}
        blocName="Gouvernance, administration et référents"
        resourceType="structures"
        relatedObjectTypes={['persons']}
        Form={MandateForm}
        sort="relationType.priority"
      />
      <RelationsByTag
        tag={STRUCTURE_CATEGORIE}
        blocName="Catégories"
        resourceType="structures"
        relatedObjectTypes={['categories']}
        noRelationType
        sort="relatedObject.priority"
      />
      <RelationsByTag
        tag="supervision"
        blocName="Tutelles"
        resourceType="structures"
        relatedObjectTypes={['structures']}
        sort="relationType.priority"
      />
      <RelationsByTag
        tag="supervision"
        blocName="Structures supervisées"
        inverse
        resourceType="structures"
        relatedObjectTypes={['structures']}
        sort="relationType.priority"
      />
      <RelationsByTag
        tag="structure-parent"
        blocName="Parents"
        resourceType="structures"
        relatedObjectTypes={['structures']}
        sort="relationType.priority"
      />
      <RelationsByTag
        tag="structure-parent"
        blocName="Enfants"
        inverse
        resourceType="structures"
        relatedObjectTypes={['structures']}
        sort="relationType.priority"
      />
      <Title as="h3" look="h4">Présence sur le web</Title>
      <Row gutters>
        <Col n="12 md-6">
          <Weblinks types={INTERNAL_PAGES_TYPES} title="Site internet" />
        </Col>
        <Col n="12 md-6">
          <SocialMedias />
        </Col>
        <Col n="12 md-6">
          <Weblinks types={WEBLINKS_TYPES} title="Ailleurs sur le web" />
        </Col>
      </Row>
      <Emails />
      <Identifiers />
    </>
  );
}
